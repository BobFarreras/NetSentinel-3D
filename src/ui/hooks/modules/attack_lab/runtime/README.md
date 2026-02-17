<!-- Ruta: src/ui/hooks/modules/attack_lab/runtime/README.md -->
<!-- Descripcion: submodulo interno del runtime Attack Lab. Separa store (estado/persistencia) y acciones (runners/cancel). -->

# Attack Lab runtime (internals)

Esta carpeta desacopla el runtime de Attack Lab en piezas pequenas:

- `attackLabRuntimeStore.ts`: store singleton (estado + persistencia + listeners de eventos).
- `attackLabRuntimeActions.ts`: acciones/runners (external/simulated/native) + cancel/clear.
- `attackLabRuntimeTypes.ts`: tipos compartidos (estado, filas de log, runner nativo).
- `attackLabRuntimeWiring.ts`: wiring del singleton con `attackLabAdapter`.

## Por que existe

Antes, `useAttackLabRuntime` mezclaba en un mismo archivo:

- estado + persistencia,
- listeners de eventos Tauri,
- y runners de ejecucion.

Separarlo reduce deuda tecnica y hace que sea mas facil de testear y mantener sin tocar el UX.

