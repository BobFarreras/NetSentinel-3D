---
name: tauri-command-change
description: Guia para anadir/renombrar/eliminar comandos Tauri sin romper contratos Rust/TypeScript ni documentacion.
---

# Cambios de comandos Tauri

## Cuando usar este skill

Usalo cuando vayas a:

- Anadir un comando nuevo.
- Renombrar/eliminar un comando existente.
- Cambiar payload/DTO de entrada/salida de un comando.

## Checklist por capas (obligatorio)

1. Backend: API commands
   - Entry-point (agregador): `src-tauri/src/api/commands.rs`
   - Implementacion por feature: `src-tauri/src/api/commands/*.rs`
   - Validacion (si aplica): `src-tauri/src/api/validators.rs`

2. Backend: Application/Domain/Infrastructure
   - Caso de uso: `src-tauri/src/application/<feature>/*`
   - Entidades/puertos: `src-tauri/src/domain/entities.rs`, `src-tauri/src/domain/ports.rs`
   - Implementaciones concretas: `src-tauri/src/infrastructure/*`

3. Contratos y tipado
   - Rust DTOs: `src-tauri/src/api/dtos.rs`
   - TS DTOs: `src/shared/dtos/NetworkDTOs.ts`
   - Nota: si cambias un tipo compartido, actualiza ambos lados en el mismo cambio.

4. Frontend: adapters y consumo
   - Adapters: `src/adapters/*Adapter.ts` (fuente de verdad en UI)
   - Bridge/E2E mock: `src/shared/tauri/bridge.ts` (si el comando existe en e2e)
   - Consumidores: `src/ui/features/*` (hooks/paneles)

5. Documentacion
   - `AGENTS.md` (lista de comandos fuente de verdad)
   - `docs/ARCHITECTURE.md` (mapa de capas/flujo)
   - `src-tauri/src/api/commands/README.md` (si aplica por agrupacion)
   - `docs/SECURITY.md` si hay impacto de hardening/politicas

## Eventos (streaming)

Si el comando emite eventos:

- Backend: definir sink/emit en `src-tauri/src/api/sinks/*` (preferible) o en el comando si es simple.
- Frontend: documentar nombres de eventos y tipos en el README de la feature.

## Validaciones minimas

- `npm test -- --run`
- `npm run build`
- `cd src-tauri && cargo check`

## Definition of Done

- El comando funciona end-to-end (UI -> invoke -> backend -> respuesta/eventos).
- No hay referencias al nombre antiguo (si fue rename): `rg -n "<old_command>"`.
- Docs y contratos actualizados en el mismo cambio.

