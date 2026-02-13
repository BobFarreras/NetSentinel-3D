<!-- src-tauri/src/application/legacy/README.md -->
<!-- Descripcion: carpeta de shims legacy para mantener imports historicos mientras el backend migra a modulos por dominio. -->

# Application Legacy (shims)

Esta carpeta contiene **wrappers/shims** que reexportan tipos desde los modulos reales de `src-tauri/src/application/<dominio>/`.

Objetivo:
- Mantener compatibilidad con paths historicos (`crate::application::*_service`) mientras se migra el wiring interno y los consumidores.
- Evitar que la raiz de `application/` se llene de archivos legacy.

Regla:
- El codigo nuevo debe importar desde `crate::application::<dominio>::...` (por ejemplo `crate::application::wifi::WifiService`).
- Cuando no haya consumidores legacy, se puede:
  1. eliminar los `#[path = "legacy/..."]` de `src-tauri/src/application/mod.rs`
  2. borrar esta carpeta.

