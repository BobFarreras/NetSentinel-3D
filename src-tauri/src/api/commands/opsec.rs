use tauri::State;
use crate::application::opsec_service::OpSecService;
use crate::api::dtos::MacSecurityStatusDTO;

pub fn check_mac_security(service: State<'_, OpSecService>) -> Result<MacSecurityStatusDTO, String> {
    service.check_interface_security()
}


pub async fn randomize_mac(service: State<'_, OpSecService>) -> Result<String, String> {
    service.randomize_identity().await
}