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
- `mod.rs`: facade del modulo. Declara submodulos por feature (`api::commands::<feature>::...`).
- `attack_lab.rs`: `start_attack_lab`, `cancel_attack_lab` + streaming `attack-lab-*` (via sink).
- `scanner.rs`: `scan_network`, `audit_target`, `run_iot_scan`
- `router_audit.rs`: `audit_router`, `fetch_router_devices`
- `history.rs`: `get_history`, `save_scan`
- `snapshot.rs`: `save_latest_snapshot`, `load_latest_snapshot`
- `settings.rs`: `get_app_settings`, `save_app_settings`, `set_ui_language`
- `credentials.rs`: `save_gateway_credentials`, `get_gateway_credentials`, `delete_gateway_credentials`
- `gateway_credential_presets.rs`: `list_gateway_credential_presets`, `add_gateway_credential_preset`, `remove_gateway_credential_preset`, `update_gateway_credential_preset`
- `wifi.rs`: `scan_airwaves`, `wifi_connect`
- `http_fingerprint.rs`: `fingerprint_http_headers`
- `system.rs`: `get_identity`, `start_traffic_sniffing`, `stop_traffic_sniffing`, `start_jamming`, `stop_jamming` + evento `traffic-event`
- `opsec.rs`: `check_mac_security`, `randomize_mac`
- `wordlist.rs`: `get_dictionary`, `add_to_dictionary`, `update_in_dictionary`, `remove_from_dictionary`
