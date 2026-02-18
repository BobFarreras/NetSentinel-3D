fn main() {
    // Nota (Windows): pnet/Npcap depende de `Packet.dll`/`wpcap.dll`.
    // En entornos limpios (VMs, PCs sin Npcap) esto puede impedir que la app ARRANQUE.
    //
    // Solucion profesional (UX): delay-load de esas DLLs.
    // Resultado:
    // - La app abre aunque Npcap no este instalado.
    // - Solo falla (con error controlado) cuando el usuario intenta usar Live Traffic / Jammer.
    //
    // Importante:
    // - Esto solo aplica a MSVC. En otros toolchains no usamos /DELAYLOAD.
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_env = std::env::var("CARGO_CFG_TARGET_ENV").unwrap_or_default();
    if target_os == "windows" && target_env == "msvc" {
        // Linker helper para delay-load.
        println!("cargo:rustc-link-lib=delayimp");
        // Delay-load de las DLLs de captura.
        println!("cargo:rustc-link-arg=/DELAYLOAD:Packet.dll");
        println!("cargo:rustc-link-arg=/DELAYLOAD:wpcap.dll");
    }

    // Definimos atributos específicos para Windows
    let mut windows = tauri_build::WindowsAttributes::new();

    // Le inyectamos nuestro archivo app.manifest
    windows = windows.app_manifest(include_str!("app.manifest"));

    // Construimos Tauri con esos atributos
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("failed to run build script");
}
