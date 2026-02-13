<!-- Ruta: src-tauri/src/api/commands/README.md -->
<!-- Descripcion: mapa de comandos Tauri. Cada archivo agrupa comandos por feature y conecta DTOs + servicios de application. -->

# API Commands (Tauri)

Esta carpeta agrupa los comandos Tauri (entrypoints IPC). Es la capa de presentacion del backend: valida inputs, llama a casos de uso (application) y serializa DTOs de salida.

## Interconexiones

Entradas:
- Frontend invoca comandos via adapters: `src/adapters/*Adapter.ts` o via `invoke` directo en casos puntuales.

Salidas:
- Respuestas (DTOs): `src-tauri/src/api/dtos.rs` y `src/shared/dtos/NetworkDTOs.ts`
- Eventos (streaming): emitidos por sinks en `src-tauri/src/api/sinks/*` y consumidos en frontend via `listenEvent`.

Archivos:
- `attack_lab.rs`: `start_attack_lab`, `cancel_attack_lab` + streaming `attack-lab-*` (via sink).
- `scanner.rs`: `scan_network`
- `wifi.rs`: `scan_airwaves`
- `system.rs`: `start_traffic_sniffing`, `stop_traffic_sniffing` + evento `traffic-event`
- `opsec.rs`: `check_mac_security`, `randomize_mac`, `get_identity`
- `history.rs`: `get_history`, `save_scan`
- `snapshot.rs`: `save_latest_snapshot`, `load_latest_snapshot`
- `credentials.rs`: `save_gateway_credentials`, `get_gateway_credentials`, `delete_gateway_credentials`
- `wordlist.rs`: `get_dictionary`, `add_to_dictionary`, `update_in_dictionary`, `remove_from_dictionary`
