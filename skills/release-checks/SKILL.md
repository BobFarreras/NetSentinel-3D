---
name: release-checks
description: Ejecuta validaciones minimas (frontend + backend), resume resultados y deja evidencia para cerrar cambios.
---

# Release Checks (NetSentinel)

## Cuando usar este skill

Usa este skill antes de cerrar una tanda de cambios, especialmente si:

- Se tocaron comandos Tauri, DTOs, adapters o features UI.
- Se movieron ficheros o se cambio estructura.

## Pasos

1. Verifica que el arbol esta limpio o entiende el scope del diff
   - `git status --porcelain`
   - (opcional) `git diff --stat`

2. Ejecuta validaciones frontend
   - `npm test -- --run`
   - `npm run build`

3. Ejecuta validaciones backend (Rust)
   - `cd src-tauri`
   - `cargo check`
   - (opcional si procede) `cargo test --lib -q`

4. Revisa contratos Rust/TS si hubo cambios en comandos/DTOs
   - Rust DTOs: `src-tauri/src/api/dtos.rs`
   - TS DTOs: `src/shared/dtos/NetworkDTOs.ts`
   - Adapters: `src/adapters/*Adapter.ts`

5. Deja evidencia en el PR/nota de cambio (texto corto)
   - Que se cambio
   - Que validaciones pasaron
   - Riesgos pendientes

## Definition of Done

- `npm test -- --run` en verde
- `npm run build` en verde
- `cargo check` en verde
- Si aplica: contratos Rust/TS coherentes y documentacion actualizada

