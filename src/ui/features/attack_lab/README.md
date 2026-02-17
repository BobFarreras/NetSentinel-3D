<!-- Ruta: src/ui/features/attack_lab/README.md -->
<!-- Descripcion: feature Attack Lab (antes external_audit). Incluye catalogo de escenarios, panel UI y hooks para ejecucion real (Tauri) o simulada (LAB). -->

# Attack Lab (UI)

Feature de auditoria ofensiva controlada y simulaciones didacticas. Presenta un catalogo de escenarios y ejecuta:

- Modo `external`: invoca backend Rust via Tauri y consume eventos streaming.
- Modo `simulated`: ejecuta una simulacion trazable en frontend (pasos `SimStep`).
- Modo `native`: ejecucion local (sin procesos externos) con logica TypeScript y/o invocacion de comandos Tauri especificos (ej. HTTP fingerprint en Rust).

## Interconexiones

Entradas:
- Panel montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx` y `src/ui/components/layout/DetachedPanelView.tsx`.
- Contexto de objetivo: normalmente se abre desde Radar/Device Detail pasando `targetDevice` y `defaultScenarioId`.

### Targets: Red vs Radar (explicacion simple)
Attack Lab opera con un `DeviceDTO` como target, pero el origen del target puede ser distinto:

- Red (Scene/Scanner): targets con IP real (IPv4). Se obtienen de `scan_network` y del snapshot.
- Radar (WiFi Spectrum): targets "virtuales" construidos desde una red WiFi detectada (SSID/BSSID). No tienen IPv4 real.

Regla de UX:
- El selector de TARGET cambia segun `category` del escenario:
  - `WIFI` => lista redes WiFi del Radar.
  - `ROUTER` => candidatos a gateway/router.
  - `DEVICE/IOT/EDU` => dispositivos de red (IPv4).

Nota importante:
- Abrir Attack Lab desde Device Detail no debe auto-seleccionar ningun escenario: el operador elige manualmente.

IPC:
- Adapter: `src/adapters/attackLabAdapter.ts`
- Comandos Tauri: `start_attack_lab`, `cancel_attack_lab`
- Eventos Tauri: `attack-lab-log`, `attack-lab-exit`
- DTOs: `src/shared/dtos/NetworkDTOs.ts` (tipos `AttackLabLogEvent`, `AttackLabExitEvent`, `DeviceDTO`)

Comandos extra usados por escenarios `native` (no pasan por `start_attack_lab`):
- `fingerprint_http_headers` (HTTP headers via backend Rust)

Dependencias internas:
- Catalogo de escenarios (agregador): `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`
- Tipos del catalogo: `src/ui/features/attack_lab/catalog/types.ts`
- Escenarios por dominio: `src/ui/features/attack_lab/catalog/scenarios/`
- Estado/ejecucion: `src/ui/features/attack_lab/hooks/useAttackLab.ts`
- Runtime persistente (shared): `src/ui/hooks/modules/attack_lab/useAttackLabRuntime.ts`
- Sincronizacion en panel detached: `src/ui/features/attack_lab/hooks/useAttackLabDetachedSync.ts`
- UI principal: `src/ui/features/attack_lab/panel/AttackLabPanel.tsx`
- Reutiliza wordlists: `src/ui/features/wordlist/hooks/useWordlistManager.ts`

## Tests

- UI: `src/ui/features/attack_lab/__tests__/AttackLabPanel.test.tsx`
- Hooks: `src/ui/features/attack_lab/__tests__/useAttackLabDetachedSync.test.ts`
