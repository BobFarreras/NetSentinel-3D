<!-- Ruta: src/ui/features/attack_lab/README.md -->
<!-- Descripcion: feature Attack Lab (antes external_audit). Incluye catalogo de escenarios, panel UI y hooks para ejecucion real (Tauri) o simulada (LAB). -->

# Attack Lab (UI)

Feature de auditoria ofensiva controlada y simulaciones didacticas. Presenta un catalogo de escenarios y ejecuta:

- Modo `external`: invoca backend Rust via Tauri y consume eventos streaming.
- Modo `simulated`: ejecuta una simulacion trazable en frontend (pasos `SimStep`).

## Interconexiones

Entradas:
- Panel montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx` y `src/ui/components/layout/DetachedPanelView.tsx`.
- Contexto de objetivo: normalmente se abre desde Radar/Device Detail pasando `targetDevice` y `defaultScenarioId`.

IPC:
- Adapter: `src/adapters/attackLabAdapter.ts`
- Comandos Tauri: `start_attack_lab`, `cancel_attack_lab`
- Eventos Tauri: `attack-lab-log`, `attack-lab-exit`
- DTOs: `src/shared/dtos/NetworkDTOs.ts` (tipos `AttackLabLogEvent`, `AttackLabExitEvent`, `DeviceDTO`)

Dependencias internas:
- Catalogo de escenarios: `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`
- Estado/ejecucion: `src/ui/features/attack_lab/hooks/useAttackLab.ts`
- Sincronizacion en panel detached: `src/ui/features/attack_lab/hooks/useAttackLabDetachedSync.ts`
- UI principal: `src/ui/features/attack_lab/panel/AttackLabPanel.tsx`
- Reutiliza wordlists: `src/ui/features/wordlist/hooks/useWordlistManager.ts`

## Tests

- UI: `src/ui/features/attack_lab/__tests__/AttackLabPanel.test.tsx`
- Hooks: `src/ui/features/attack_lab/__tests__/useAttackLabDetachedSync.test.ts`

