---
name: feature-readme
description: Crea/actualiza README.md por feature/carpeta siguiendo la plantilla y documentando interconexiones (entrypoints, comandos, eventos, DTOs).
---

# README por feature/carpeta

## Cuando usar este skill

Usalo cuando:

- Se crea una feature nueva (`src/ui/features/<feature>/` o `src-tauri/src/application/<feature>/`).
- Se mueve/renombra una feature o cambian sus dependencias.
- Un junior/agente pierde contexto y cuesta entender el flujo.

## Plantilla

- Fuente de verdad: `docs/FEATURE_README_TEMPLATE.md`

## Pasos (UI)

1. Crea `src/ui/features/<feature>/README.md`

2. Rellena interconexiones:
   - Entrypoints (donde se monta el panel/escena):
     - `src/ui/components/layout/MainDockedLayout.tsx`
     - `src/ui/components/layout/DetachedPanelView.tsx`
   - IPC:
     - adapters: `src/adapters/*Adapter.ts`
     - comandos/eventos: `AGENTS.md` y `src/shared/tauri/bridge.ts`
   - DTOs:
     - `src/shared/dtos/NetworkDTOs.ts`

3. Añade rutas a hooks/componentes principales del feature.

## Pasos (Backend)

1. Si es un modulo de application, crea `src-tauri/src/application/<feature>/README.md`
2. Si es infra, crea `src-tauri/src/infrastructure/<modulo>/README.md`
3. Documenta:
   - puertos: `src-tauri/src/domain/ports.rs`
   - entidades: `src-tauri/src/domain/entities.rs`
   - comandos: `src-tauri/src/api/commands/*.rs`

## Definition of Done

- El README responde rapido:
  - Que hace
  - Que no hace
  - Por donde entra (entrypoint)
  - Por donde sale (comandos/eventos/DTOs)
  - Que tests existen

