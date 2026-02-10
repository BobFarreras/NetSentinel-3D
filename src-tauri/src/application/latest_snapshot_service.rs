use crate::domain::entities::{Device, LatestSnapshot};
use crate::domain::ports::LatestSnapshotRepositoryPort;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct LatestSnapshotService {
    repo: Arc<dyn LatestSnapshotRepositoryPort>,
}

impl LatestSnapshotService {
    pub fn new(repo: Arc<dyn LatestSnapshotRepositoryPort>) -> Self {
        Self { repo }
    }

    pub async fn save_devices(&self, devices: Vec<Device>) -> Result<(), String> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        self.repo
            .save_latest(LatestSnapshot { timestamp, devices })
            .await
    }

    pub async fn load_snapshot(&self) -> Result<Option<LatestSnapshot>, String> {
        self.repo.load_latest().await
    }
}

