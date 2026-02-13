<!-- Ruta: src-tauri/src/application/attack_lab/README.md -->
<!-- Descripcion: caso de uso Attack Lab. Orquesta ejecucion (runner) + validacion + emision de eventos via puerto (sink). -->

# Attack Lab (Application)

Caso de uso que coordina la ejecucion de auditorias/labs. Mantiene reglas de negocio simples (validacion, timeouts, control de cancelacion) y delega:

- Ejecucion real: `AttackLabRunnerPort` (infraestructura).
- Streaming de eventos hacia UI: `AttackLabEventSinkPort` (API/sink).

## Interconexiones

Puertos:
- `src-tauri/src/domain/ports.rs`: `AttackLabRunnerPort`, `AttackLabEventSinkPort`

Entidades/Tipos:
- `src-tauri/src/domain/entities.rs`: `AttackLabRequest`, `AttackLabLogEvent`, `AttackLabExitEvent`

Implementaciones concretas:
- Runner: `src-tauri/src/infrastructure/attack_lab/runner.rs`
- Sink Tauri: `src-tauri/src/api/sinks/attack_lab_tauri_sink.rs`

API:
- Comandos: `src-tauri/src/api/commands/attack_lab.rs`

