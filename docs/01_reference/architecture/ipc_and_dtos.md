<!-- docs/01_reference/architecture/ipc_and_dtos.md -->
<!-- Descripcion: IPC Tauri (invoke/eventos) y contratos compartidos (DTOs) Rust <-> TypeScript. -->

# IPC y DTOs (contratos)

## 1) IPC (como se hablan UI y backend)
Dos canales:
1. `invoke`: UI llama un comando y espera respuesta.
2. `eventos`: backend emite eventos en tiempo real (streaming).

## 2) Archivos importantes
Frontend:
- Bridge (fachada): `src/shared/tauri/bridge.ts`
- Adapters (por feature): `src/adapters/*`

Backend:
- Comandos: `src-tauri/src/api/commands/*`
- Registro de comandos: `src-tauri/src/lib.rs`

## 3) DTOs (contratos tipados)
Fuente de verdad:
- Rust: `src-tauri/src/api/dtos.rs`
- TS: `src/shared/dtos/NetworkDTOs.ts`

Regla de oro:
- Si cambias un DTO, cambias Rust y TS en el mismo PR/commit.

