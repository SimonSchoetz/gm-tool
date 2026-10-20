use std::fs;
use std::path::Path;

use super::{backup_path, database_dir, staging_path, validate_backup_request};

/// Renames the copy the frontend wrote to `prepare_database_backup`'s staging path to its backup name.
#[tauri::command]
pub async fn finish_database_backup(
    app_handle: tauri::AppHandle,
    database_file: String,
    ledger_head: String,
) -> Result<(), String> {
    finish_in(&database_dir(&app_handle)?, &database_file, &ledger_head)
}

fn finish_in(dir: &Path, database_file: &str, ledger_head: &str) -> Result<(), String> {
    validate_backup_request(database_file, ledger_head)?;

    fs::rename(
        staging_path(dir, database_file, ledger_head),
        backup_path(dir, database_file, ledger_head),
    )
    .map_err(|e| format!("Failed to finish the backup: {e}"))
}

#[cfg(test)]
mod tests {
    use super::super::test_dir::TestDir;
    use super::*;

    #[test]
    fn renames_the_staging_copy_to_its_backup_name() {
        let dir = TestDir::new("finish-rename");
        fs::write(
            dir.path().join("gm_tool.db.bak-1789743068849.partial"),
            b"copy",
        )
        .unwrap();

        finish_in(dir.path(), "gm_tool.db", "1789743068849").unwrap();

        assert_eq!(dir.file_names(), ["gm_tool.db.bak-1789743068849"]);
        assert_eq!(
            fs::read(dir.path().join("gm_tool.db.bak-1789743068849")).unwrap(),
            b"copy"
        );
    }

    #[test]
    fn fails_and_leaves_the_directory_unchanged_when_no_staging_copy_exists() {
        let dir = TestDir::new("finish-missing");
        fs::write(dir.path().join("gm_tool.db.bak-4"), b"").unwrap();

        assert!(finish_in(dir.path(), "gm_tool.db", "5").is_err());
        assert_eq!(dir.file_names(), ["gm_tool.db.bak-4"]);
    }
}
