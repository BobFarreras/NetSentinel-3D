use async_trait::async_trait;
use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;

use crate::domain::entities::LatestSnapshot;
use crate::domain::ports::LatestSnapshotRepositoryPort;

pub struct FileLatestSnapshotRepository;

impl FileLatestSnapshotRepository {
    fn get_snapshot_path() -> PathBuf {
        if let Some(proj_dirs) = ProjectDirs::from("com", "netsentinel", "app") {
            let data_dir = proj_dirs.data_dir();
            if !data_dir.exists() {
                let _ = fs::create_dir_all(data_dir);
            }
            return data_dir.join("latest_snapshot.json");
        }
        PathBuf::from("netsentinel_latest_snapshot.json")
    }
}

#[async_trait]
impl LatestSnapshotRepositoryPort for FileLatestSnapshotRepository {
    async fn save_latest(&self, snapshot: LatestSnapshot) -> Result<(), String> {
        let path = Self::get_snapshot_path();
        let json = serde_json::to_string_pretty(&snapshot).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    async fn load_latest(&self) -> Result<Option<LatestSnapshot>, String> {
        let path = Self::get_snapshot_path();
        if !path.exists() {
            return Ok(None);
        }
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        let snapshot: LatestSnapshot = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(Some(snapshot))
    }
}

