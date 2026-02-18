<!-- docs/01_reference/architecture/commands_and_events.md -->
<!-- Descripcion: donde se documentan comandos y eventos, y reglas para mantenerlos sincronizados. -->

# Comandos y eventos

## 1) Comandos Tauri
Fuente de verdad:
- `src-tauri/src/api/commands/mod.rs`
- `src-tauri/src/lib.rs`

Lista humana (para onboarding):
- `AGENTS.md` (seccion “Comandos Tauri”)

## 2) Eventos (streaming)
Ejemplos:
- `traffic-event` (Live Traffic)
- `attack-lab-log` / `attack-lab-exit` (Attack Lab)

Regla:
- Si anades un evento nuevo, documenta el nombre y el payload en el README de la feature (`src/ui/features/<feature>/README.md`).

