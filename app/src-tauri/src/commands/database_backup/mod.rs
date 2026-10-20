// Database backup commands. The frontend copies the database itself with `VACUUM INTO` through tauri-plugin-sql, which snapshots it consistently while the plugin's pool holds it open (`app/db/database-backup.ts`); these commands own the backup file names and the pruning, which need the filesystem access the webview lacks.
mod finish_database_backup;
mod prepare_database_backup;
mod prune_database_backups;

pub use finish_database_backup::finish_database_backup;
pub use prepare_database_backup::prepare_database_backup;
pub use prune_database_backups::prune_database_backups;

use std::path::{Path, PathBuf};
use tauri::Manager;

/// tauri-plugin-sql opens a `sqlite:<file>` database inside the app config directory, so its backups sit beside it there.
pub(crate) fn database_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config directory: {e}"))
}

/// A bare file name keeps a webview-supplied database name from reaching outside the database directory: no path separator, and no leading `.` that could form `..`.
fn is_valid_database_file(name: &str) -> bool {
    !name.is_empty()
        && !name.starts_with('.')
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-' || c == '.')
}

/// Ledger heads are migration ids, which are `Date.now()` timestamps; one that fits a `u64` is the one a backup name can carry and pruning can rank.
fn is_valid_ledger_head(head: &str) -> bool {
    !head.is_empty() && head.chars().all(|c| c.is_ascii_digit()) && head.parse::<u64>().is_ok()
}

pub(crate) fn validate_backup_request(
    database_file: &str,
    ledger_head: &str,
) -> Result<(), String> {
    if !is_valid_database_file(database_file) {
        return Err(format!("Invalid database file name: {database_file}"));
    }
    if !is_valid_ledger_head(ledger_head) {
        return Err(format!("Invalid ledger head: {ledger_head}"));
    }
    Ok(())
}

fn backup_prefix(database_file: &str) -> String {
    format!("{database_file}.bak-")
}

pub(crate) fn backup_path(dir: &Path, database_file: &str, ledger_head: &str) -> PathBuf {
    dir.join(format!("{}{ledger_head}", backup_prefix(database_file)))
}

/// The copy is written here first and renamed to its `backup_path` once complete, so a backup name never holds a copy that an interrupted `VACUUM INTO` left incomplete.
pub(crate) fn staging_path(dir: &Path, database_file: &str, ledger_head: &str) -> PathBuf {
    dir.join(format!(
        "{}{ledger_head}.partial",
        backup_prefix(database_file)
    ))
}

/// The ledger head a `backup_path` file name carries, or `None` for any other file, a staging file included.
pub(crate) fn backup_ledger_head(database_file: &str, file_name: &str) -> Option<u64> {
    let head = file_name.strip_prefix(&backup_prefix(database_file))?;
    if !is_valid_ledger_head(head) {
        return None;
    }
    head.parse().ok()
}

#[cfg(test)]
pub(crate) mod test_dir {
    use std::path::{Path, PathBuf};

    /// A fresh directory under the system temp directory, removed with its contents when dropped.
    pub(crate) struct TestDir(PathBuf);

    impl TestDir {
        pub(crate) fn new(name: &str) -> Self {
            let path = std::env::temp_dir().join(format!(
                "gm-tool-database-backup-{}-{name}",
                std::process::id()
            ));
            let _ = std::fs::remove_dir_all(&path);
            std::fs::create_dir_all(&path).expect("create test directory");
            Self(path)
        }

        pub(crate) fn path(&self) -> &Path {
            &self.0
        }

        pub(crate) fn file_names(&self) -> Vec<String> {
            let mut names: Vec<String> = std::fs::read_dir(&self.0)
                .expect("read test directory")
                .map(|entry| {
                    entry
                        .expect("read entry")
                        .file_name()
                        .into_string()
                        .expect("UTF-8 name")
                })
                .collect();
            names.sort();
            names
        }
    }

    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_the_app_database_file_and_a_migration_id() {
        assert_eq!(
            validate_backup_request("gm_tool.db", "1789743068849"),
            Ok(())
        );
    }

    #[test]
    fn rejects_a_database_file_that_could_leave_the_directory() {
        for name in [
            "",
            "../gm_tool.db",
            "dir/gm_tool.db",
            "dir\\gm_tool.db",
            "..",
            ".hidden",
        ] {
            assert!(
                validate_backup_request(name, "1789743068849").is_err(),
                "{name:?} was accepted"
            );
        }
    }

    #[test]
    fn rejects_a_ledger_head_that_is_not_a_migration_id() {
        for head in [
            "",
            "17897430688a9",
            "../1789743068849",
            "1789743068849/x",
            "18446744073709551616",
        ] {
            assert!(
                validate_backup_request("gm_tool.db", head).is_err(),
                "{head:?} was accepted"
            );
        }
    }

    #[test]
    fn reads_the_ledger_head_only_from_a_finished_backup_of_the_same_database() {
        assert_eq!(
            backup_ledger_head("gm_tool.db", "gm_tool.db.bak-1789743068849"),
            Some(1789743068849)
        );
        for name in [
            "gm_tool.db",
            "gm_tool.db-wal",
            "gm_tool.db.bak-1789743068849.partial",
            "gm_tool.db.bak-",
            "gm_tool.db.bak-notes",
            "other.db.bak-1789743068849",
        ] {
            assert_eq!(backup_ledger_head("gm_tool.db", name), None, "{name:?}");
        }
    }
}
