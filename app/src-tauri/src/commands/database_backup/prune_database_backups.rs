use std::fs;
use std::path::Path;

use super::{backup_ledger_head, database_dir, validate_backup_request};

/// How many finished backups of a database are kept.
const KEPT_BACKUPS: usize = 3;

/// Deletes finished backups of `database_file` until `KEPT_BACKUPS` remain: the one at `ledger_head`, just taken, and the others with the highest ledger heads. The one just taken is kept even when its ledger head is not among the highest, as after a database restored from an older backup.
#[tauri::command]
pub async fn prune_database_backups(
    app_handle: tauri::AppHandle,
    database_file: String,
    ledger_head: String,
) -> Result<(), String> {
    prune_in(&database_dir(&app_handle)?, &database_file, &ledger_head)
}

fn prune_in(dir: &Path, database_file: &str, ledger_head: &str) -> Result<(), String> {
    validate_backup_request(database_file, ledger_head)?;

    for file_name in backups_to_delete(database_file, ledger_head, file_names_in(dir)?) {
        fs::remove_file(dir.join(&file_name))
            .map_err(|e| format!("Failed to delete old backup {file_name}: {e}"))?;
    }
    Ok(())
}

fn file_names_in(dir: &Path) -> Result<Vec<String>, String> {
    let mut names = Vec::new();
    for entry in
        fs::read_dir(dir).map_err(|e| format!("Failed to list the database directory: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Failed to list the database directory: {e}"))?;
        // A name that is not UTF-8 is never one `backup_path` produced.
        if let Ok(name) = entry.file_name().into_string() {
            names.push(name);
        }
    }
    Ok(names)
}

fn backups_to_delete(
    database_file: &str,
    ledger_head: &str,
    file_names: Vec<String>,
) -> Vec<String> {
    let current: Option<u64> = ledger_head.parse().ok();
    let mut others: Vec<(u64, String)> = file_names
        .into_iter()
        .filter_map(|name| Some((backup_ledger_head(database_file, &name)?, name)))
        .filter(|(head, _)| Some(*head) != current)
        .collect();
    others.sort_by_key(|(head, _)| std::cmp::Reverse(*head));
    others
        .into_iter()
        .skip(KEPT_BACKUPS - 1)
        .map(|(_, name)| name)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::super::test_dir::TestDir;
    use super::*;

    fn seed(dir: &TestDir, names: &[&str]) {
        for name in names {
            fs::write(dir.path().join(name), b"").unwrap();
        }
    }

    #[test]
    fn keeps_the_three_backups_with_the_highest_ledger_heads_and_every_other_file() {
        let dir = TestDir::new("prune-highest");
        seed(
            &dir,
            &[
                "gm_tool.db",
                "gm_tool.db-wal",
                "gm_tool.db.bak-999",
                "gm_tool.db.bak-1000",
                "gm_tool.db.bak-1001",
                "gm_tool.db.bak-1002",
                "gm_tool.db.bak-1003.partial",
                "gm_tool.db.bak-notes",
                "other.db.bak-1",
            ],
        );

        prune_in(dir.path(), "gm_tool.db", "1002").unwrap();

        assert_eq!(
            dir.file_names(),
            [
                "gm_tool.db",
                "gm_tool.db-wal",
                "gm_tool.db.bak-1000",
                "gm_tool.db.bak-1001",
                "gm_tool.db.bak-1002",
                "gm_tool.db.bak-1003.partial",
                "gm_tool.db.bak-notes",
                "other.db.bak-1",
            ]
        );
    }

    #[test]
    fn keeps_the_backup_just_taken_when_three_backups_have_higher_ledger_heads() {
        let dir = TestDir::new("prune-current-lowest");
        seed(
            &dir,
            &[
                "gm_tool.db.bak-5",
                "gm_tool.db.bak-7",
                "gm_tool.db.bak-8",
                "gm_tool.db.bak-9",
            ],
        );

        prune_in(dir.path(), "gm_tool.db", "5").unwrap();

        assert_eq!(
            dir.file_names(),
            ["gm_tool.db.bak-5", "gm_tool.db.bak-8", "gm_tool.db.bak-9"]
        );
    }

    #[test]
    fn rejects_an_invalid_ledger_head_and_deletes_nothing() {
        let dir = TestDir::new("prune-invalid");
        seed(
            &dir,
            &[
                "gm_tool.db.bak-1",
                "gm_tool.db.bak-2",
                "gm_tool.db.bak-3",
                "gm_tool.db.bak-4",
            ],
        );

        assert!(prune_in(dir.path(), "gm_tool.db", "4a").is_err());
        assert_eq!(dir.file_names().len(), 4);
    }
}
