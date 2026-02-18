<!-- docs/01_reference/architecture/backend.md -->
<!-- Descripcion: arquitectura del backend (Rust) por capas hexagonales y puntos de entrada Tauri. -->

# Backend (Rust + Tauri)

## 1) Regla principal
El backend hace el trabajo “duro”:
- red,
- sistema,
- filesystem,
- scraping/parseo (si aplica),
y devuelve DTOs o emite eventos.

## 2) Capas (hexagonal pragmatica)
Dominio:
- `src-tauri/src/domain/*`
- entidades y puertos (traits)

Aplicacion:
- `src-tauri/src/application/*`
- casos de uso (servicios) que coordinan puertos

Infraestructura:
- `src-tauri/src/infrastructure/*`
- implementaciones reales (I/O)

Presentacion (API Tauri):
- `src-tauri/src/api/commands/*` (comandos)
- `src-tauri/src/api/dtos.rs` (DTOs)
- `src-tauri/src/lib.rs` (registro/wiring)

## 3) Donde se declaran los comandos
Fuente de verdad:
- `src-tauri/src/api/commands/mod.rs`
- `src-tauri/src/lib.rs`

Regla: si cambias un comando, actualiza:
- adapters de `src/adapters/*`
- docs (minimo `docs/01_reference/SECURITY.md` si es sensible)

