fn main() {
    // Definimos atributos específicos para Windows
    let mut windows = tauri_build::WindowsAttributes::new();
    
    // Le inyectamos nuestro archivo app.manifest
    windows = windows.app_manifest(include_str!("app.manifest"));

    // Construimos Tauri con esos atributos
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("failed to run build script");
}