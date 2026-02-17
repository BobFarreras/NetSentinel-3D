<!-- Ruta: src/ui/hooks/modules/attack_lab/README.md -->
<!-- Descripcion: modulo compartido (legacy) del runtime de Attack Lab. Mantiene ejecuciones/logs persistentes aunque el panel se cierre. -->

# Runtime Attack Lab (shared)

Este modulo contiene el runtime global/persistente del Attack Lab. Se usa desde:

- `src/ui/features/attack_lab/panel/hooks/useAttackLabPanelState.ts` (panel LAB/CUSTOM)
- `src/ui/features/attack_lab/hooks/useAttackLab.ts` (orquestacion legacy por feature)

## Responsabilidades

- Mantener el estado de ejecucion (`auditId`, `isRunning`, logs, `lastExit`).
- Persistir una ventana de logs en `localStorage` para rehidratar UI tras cerrar/abrir panel.
- Consumir eventos Tauri (`attack-lab-log`, `attack-lab-exit`) via `src/adapters/attackLabAdapter.ts`.

## Entry point

- Hook publico: `src/ui/hooks/modules/attack_lab/useAttackLabRuntime.ts`

## Notas

- El runtime es un singleton: no se debe duplicar estado por panel/ventana.
- Para tests: `__resetAttackLabRuntimeForTests()` reinicia store + timers.

