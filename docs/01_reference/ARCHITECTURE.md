<!-- docs/01_reference/ARCHITECTURE.md -->
<!-- Descripcion: mapa corto de arquitectura. Si quieres detalle por departamentos, mira docs/01_reference/architecture/README.md -->

# Arquitectura (resumen)

Objetivo de este documento: que entiendas el flujo en 5 minutos.

Si quieres el detalle por departamentos: `docs/01_reference/architecture/README.md`.

## 1) Idea principal
NetSentinel 3D es una app desktop con dos mitades:
- **Frontend (React)**: pinta UI (3D + paneles) y gestiona estado.
- **Backend (Rust + Tauri)**: hace trabajo de red/sistema/FS y expone comandos.

Regla: la UI no hace operaciones de red de bajo nivel. Siempre pide al backend.

## 2) Flujo de datos (el camino)
```text
UI (hook/panel)
  -> Adapter (invoke/listen)
    -> Comando Tauri (Rust)
      -> Application (caso de uso)
        -> Infrastructure (I/O real)
      <- DTO (respuesta)
  <- UI actualiza estado y renderiza
```

## 3) Donde vive cada cosa (rutas)
Frontend:
- Features/paneles: `src/ui/features/*`
- IPC adapters: `src/adapters/*`
- Contratos TS (DTOs): `src/shared/dtos/*`
- Bridge Tauri (invoke/eventos + mock E2E): `src/shared/tauri/*`

Backend:
- Comandos Tauri: `src-tauri/src/api/commands/*`
- DTOs Rust: `src-tauri/src/api/dtos.rs`
- Casos de uso: `src-tauri/src/application/*`
- Dominio (entidades + puertos): `src-tauri/src/domain/*`
- Infra (red/fs/wifi/router/etc.): `src-tauri/src/infrastructure/*`

## 4) “Fuente de verdad” (cosas que no se discuten)
- Lista de comandos: `src-tauri/src/api/commands/mod.rs` + `src-tauri/src/lib.rs`
- Contratos Rust/TS:
  - Rust: `src-tauri/src/api/dtos.rs`
  - TS: `src/shared/dtos/NetworkDTOs.ts`

## 5) Features principales (y donde mirar)
- Scan + inventario: `src/ui/hooks/useNetworkManager.ts` y `src-tauri/src/application/scan/*`
- Device audit (puertos): `src-tauri/src/application/audit/*`
- Radar WiFi: `docs/02_guides/RADAR_VIEW.md`
- Live Traffic: `src-tauri/src/application/traffic/*` + evento `traffic-event`
- Attack Lab: `docs/02_guides/ATTACK_LAB.md`
- Seguridad/privilegios: `docs/01_reference/SECURITY.md`
