// src-tauri/src/infrastructure/wifi/windows_netsh/ffi_scan_trigger.rs

#[cfg(windows)]
use windows::Win32::Foundation::{ERROR_SUCCESS, HANDLE};
#[cfg(windows)]
use windows::Win32::NetworkManagement::WiFi::{
    WlanCloseHandle, WlanEnumInterfaces, WlanFreeMemory, WlanOpenHandle, WlanScan,
    WLAN_INTERFACE_INFO_LIST,
};

#[cfg(windows)]
pub async fn trigger_windows_wlan_scan_best_effort() {
    // Ejecutamos el FFI en un hilo blocking para evitar bloquear el runtime async.
    let _ = tokio::task::spawn_blocking(|| unsafe {
        let mut negotiated_version: u32 = 0;
        let mut client_handle: HANDLE = HANDLE::default();

        let open_status = WlanOpenHandle(2, None, &mut negotiated_version, &mut client_handle);
        if open_status != ERROR_SUCCESS.0 {
            return;
        }

        let mut if_list_ptr: *mut WLAN_INTERFACE_INFO_LIST = std::ptr::null_mut();
        let enum_status = WlanEnumInterfaces(client_handle, None, &mut if_list_ptr);
        if enum_status != ERROR_SUCCESS.0 || if_list_ptr.is_null() {
            let _ = WlanCloseHandle(client_handle, None);
            return;
        }

        // WLAN_INTERFACE_INFO_LIST contiene un array inline de longitud variable.
        let list = &*if_list_ptr;
        let infos = std::slice::from_raw_parts(
            list.InterfaceInfo.as_ptr(),
            list.dwNumberOfItems as usize,
        );
        for info in infos {
            // Scan asincrono: solicita al driver que refresque el cache de redes.
            let _ = WlanScan(client_handle, &info.InterfaceGuid, None, None, None);
        }

        WlanFreeMemory(if_list_ptr as _);
        let _ = WlanCloseHandle(client_handle, None);
    })
    .await;
}

#[cfg(not(windows))]
pub async fn trigger_windows_wlan_scan_best_effort() {
    // No-op fuera de Windows.
}

