---
name: attack-lab-scenario
description: Guia para anadir un escenario nuevo al Attack Lab (UI catalog + simulacion/ejecucion) manteniendo contratos y trazabilidad.
---

# Escenarios de Attack Lab

## Cuando usar este skill

Usalo cuando vayas a anadir un escenario nuevo al catalogo de Attack Lab:

- Escenario didactico (simulado) con pasos trazables.
- Escenario "external" que delega la ejecucion al backend via Tauri (sin acoplar UI a detalles de infraestructura).

## Reglas de arquitectura

- El catalogo vive en UI: `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`
- La ejecucion real siempre pasa por comandos Tauri:
  - `start_attack_lab`
  - `cancel_attack_lab`
- Streaming de estado hacia UI via eventos:
  - `attack-lab-log`
  - `attack-lab-exit`
- No romper contratos:
  - Rust: `src-tauri/src/api/dtos.rs`
  - TS: `src/shared/dtos/NetworkDTOs.ts`

## Pasos (UI)

1. Añade escenario al catalogo
   - `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`
   - Define `id`, `title`, `mode` (`simulated` o `external`), `timeoutMs`, y metadata de target.

2. Si es `simulated`
   - Implementa pasos (`SimStep`) claros y trazables (mensajes accionables y deterministas).
   - Asegura que el panel puede mostrar progreso y logs sin side-effects externos.

3. Si es `external`
   - Construye el `request` de forma declarativa (sin logica de ejecucion en UI).
   - La UI solo debe orquestar: request -> invoke -> eventos -> render.

4. Actualiza README del feature
   - `src/ui/features/attack_lab/README.md` (interconexiones + cambios relevantes)

## Pasos (Backend) solo si es necesario

1. Si el escenario requiere soporte nuevo en backend:
   - Domain:
     - `src-tauri/src/domain/entities.rs` (si necesitas campos nuevos)
     - `src-tauri/src/domain/ports.rs` (si necesitas un puerto nuevo)
   - Application:
     - `src-tauri/src/application/attack_lab/service.rs`
   - Infrastructure:
     - `src-tauri/src/infrastructure/attack_lab/runner.rs`
   - API:
     - `src-tauri/src/api/commands/attack_lab.rs`
     - `src-tauri/src/api/sinks/attack_lab_tauri_sink.rs` (si cambian eventos)

2. Mantener compatibilidad de DTOs
   - Si cambias payloads/eventos, cambia Rust + TS + tests en el mismo PR.

## Tests y validacion

- Añade/actualiza tests UI del catalogo/panel:
  - `src/ui/features/attack_lab/__tests__/AttackLabPanel.test.tsx`
- Validaciones minimas:
  - `npm test -- --run`
  - `npm run build`
  - `cd src-tauri && cargo check`

## Definition of Done

- Escenario aparece en UI y se puede ejecutar sin errores.
- En modo `simulated`: logs y pasos consistentes (sin IO real).
- En modo `external`: request tipado y eventos streaming renderizados correctamente.
- README y docs sincronizados.

