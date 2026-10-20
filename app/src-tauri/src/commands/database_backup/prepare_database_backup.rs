use std::fs;
use std::path::Path;

use super::{backup_path, database_dir, staging_path, validate_backup_request};

/// Returns the staging path the frontend writes a backup of `database_file` at `ledger_head` to, or `None` when the finished backup for that ledger head already exists: it was taken before an earlier attempt at the same pending migrations, so it is the copy worth keeping. A staging file an interrupted attempt left behind is removed first, because `VACUUM INTO` refuses a non-empty target.
#[tauri::command]
pub async fn prepare_database_backup(
    app_handle: tauri::AppHandle,
    database_file: String,
    ledger_head: String,
) -> Result<Option<String>, String> {
    prepare_in(&database_dir(&app_handle)?, &database_file, &ledger_head)
}

fn prepare_in(
    dir: &Path,
    database_file: &str,
    ledger_head: &str,
) -> Result<Option<String>, String> {
    validate_backup_request(database_file, ledger_head)?;

    let finished = backup_path(dir, database_file, ledger_head);
    if finished
        .try_exists()
        .map_err(|e| format!("Failed to check for an existing backup: {e}"))?
    {
        return Ok(None);
    }

    let staging = staging_path(dir, database_file, ledger_head);
    match fs::remove_file(&staging) {
        Ok(()) => {}
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => return Err(format!("Failed to remove an unfinished backup: {e}")),
    }

    staging
        .into_os_string()
        .into_string()
        .map(Some)
        .map_err(|path| format!("Backup path is not valid UTF-8: {}", path.to_string_lossy()))
}

#[cfg(test)]
mod tests {
    use super::super::test_dir::TestDir;
    use super::*;

    #[test]
    fn returns_the_staging_path_beside_the_database_when_no_backup_exists() {
        let dir = TestDir::new("prepare-fresh");
        fs::write(dir.path().join("gm_tool.db"), b"database").unwrap();

        let staging = prepare_in(dir.path(), "gm_tool.db", "1789743068849").unwrap();

        assert_eq!(
            staging,
            Some(
                dir.path()
                    .join("gm_tool.db.bak-1789743068849.partial")
                    .into_os_string()
                    .into_string()
                    .unwrap()
            )
        );
        assert_eq!(dir.file_names(), ["gm_tool.db"]);
    }

    #[test]
    fn returns_none_and_keeps_the_finished_backup_of_the_same_ledger_head() {
        let dir = TestDir::new("prepare-existing");
        fs::write(
            dir.path().join("gm_tool.db.bak-1789743068849"),
            b"earlier copy",
        )
        .unwrap();

        let staging = prepare_in(dir.path(), "gm_tool.db", "1789743068849").unwrap();

        assert_eq!(staging, None);
        assert_eq!(
            fs::read(dir.path().join("gm_tool.db.bak-1789743068849")).unwrap(),
            b"earlier copy"
        );
    }

    #[test]
    fn removes_a_staging_file_an_interrupted_attempt_left() {
        let dir = TestDir::new("prepare-stale-staging");
        fs::write(
            dir.path().join("gm_tool.db.bak-1789743068849.partial"),
            b"incomplete copy",
        )
        .unwrap();

        let staging = prepare_in(dir.path(), "gm_tool.db", "1789743068849").unwrap();

        assert!(staging.is_some());
        assert!(dir.file_names().is_empty());
    }

    #[test]
    fn rejects_an_invalid_database_file_name_before_removing_its_staging_file() {
        let dir = TestDir::new("prepare-invalid");
        // `.hidden` fails validation, yet its staging path lies inside the directory, so removing the file first would show.
        fs::write(dir.path().join(".hidden.bak-1.partial"), b"kept").unwrap();

        assert!(prepare_in(dir.path(), ".hidden", "1").is_err());
        assert_eq!(dir.file_names(), [".hidden.bak-1.partial"]);
    }
}
