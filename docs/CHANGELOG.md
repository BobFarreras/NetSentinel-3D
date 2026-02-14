<!-- docs/CHANGELOG.md -->
<!-- Descripcion: registro cronologico de cambios (arquitectura, features, refactors) y validaciones ejecutadas. -->

# Diario de desarrollo (CHANGELOG)

Todos los cambios notables en NetSentinel deben documentarse aqui.

Nota:
- Este archivo mantiene el changelog **reciente** y accionable.
- El historico (entradas antiguas) vive en `docs/CHANGELOG_LEGACY.md`.

## [v0.8.48] - Frontend/Backend: inventario autoritativo + Ghost Mode robusto (2026-02-13)
### UI (inventario)
- Gateway audit: si hay credenciales guardadas, sincroniza dispositivos via `fetch_router_devices` sin repetir `audit_router`.
- Tras sync del gateway, el inventario pasa a ser autoritativo (se eliminan nodos stale no presentes en el router).
- Scan: sigue siendo merge defensivo (no reduce inventario en scans parciales), pero mantiene fingerprint para no hidratar otra red.

### OpSec (Ghost Mode)
- Fix: `randomize_mac` ya no se basa en el toggle de `WlanSvc` (puede no cambiar la MAC).
- Ahora aplica override via `NetworkAddress` + reinicio + verificacion; si no cambia, devuelve error.
- UI: actualizacion optimista del MAC del host via evento `netsentinel://ghost-mode-applied`.

### Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)
- `cd src-tauri && cargo check` (ok)

## [v0.8.49] - UI: Settings + i18n (CA/ES/EN) (2026-02-13)
### UI (settings)
- Nuevo panel `Settings` con:
  - selector de idioma (CA/ES/EN)
  - "Field Manual" jugable con leyenda 3D (reusa `NetworkNode`) + documentacion por seccion (Radar/Attack/Console/Storage)
  - soporte de docking/undocking (panel `settings`)

### i18n (infra)
- Provider global `I18nProvider` + hook `useI18n`.
- Persistencia via backend settings (`get_app_settings`, `set_ui_language`) con fallback a `localStorage`.

### Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)
- `cd src-tauri && cargo check` (ok)

## [v0.8.50] - UI: dock resizable + panels responsive/scroll (2026-02-14)
### UI (layout)
- Dock: soporte real de resize independiente cuando estan abiertos `radar`, `attack_lab` y `settings`:
  - triple split `Radar | Attack Lab | Settings` con 2 separadores
  - split `Settings | (Radar|Attack)` con separador propio
- Se elimina el tope artificial de ancho del dock para poder estirar los paneles hasta el limite real del `NetworkScene`.

### UI (responsive)
- Radar: modo narrow (stacked) mas estable (breakpoint con histeresis) + `NODE INTEL` con filtros compactos en una sola tira (wrap) en layout lateral.
- Scroll consistente en paneles pequenos para evitar botones/inputs cortados (Radar/AttackLab/Settings).

### UI (datos)
- Registro local de alias de dispositivos (hostname/nombre) para rehidratar nombres cuando el scan/audit no los devuelve en el momento.

### Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.51] - UI: Kill Net (Jammer) robusto + JAMMED en Traffic (2026-02-14)
### UI (jammer)
- `useJamming`: acepta `identity.gatewayIp` como fallback si el inventario aun no marca `isGateway`.
- Normalizacion defensiva de MAC (soporta `AA-BB-..` y `AA:BB:..`) antes de invocar `start_jamming`.

### UI (traffic)
- `TrafficMonitor`: clasifica paquetes como `JAMMED` si:
  - vienen marcados como `isIntercepted`, o
  - el `sourceIp/destinationIp` pertenece a una IP con jammer activo.
- `ConsoleLogs`: inyecta `jammedIps` al monitor para que la pestaña/filtro `JAMMED` refleje el estado real.

### Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)


## [v0.8.47] - Frontend: Attack Lab desacoplado (bootstrap de contexto) (2026-02-13)
### UI (fix)
- Al desacoplar `attack_lab`, la ventana hija ya no pierde `targetDevice/defaultScenarioId` en el primer render.
- Se anade bootstrap efimero (TTL) via `localStorage` + emision redundante de contexto para evitar carreras al abrir la webview.

### Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)


## [v0.8.46] - Frontend: Attack Lab (auto-ejecucion solo por token) (2026-02-13)
### UI (comportamiento)
- Corregido bug: al cerrar/mostrar el Attack Lab (antes "HIDE LAB") no debe auto-ejecutar el escenario ni disparar `CyberConfirmModal`.
- El auto-run pasa a ser explicito via `autoRunToken` (solo cambia cuando se abre el lab con `autoRun`), en lugar de inferirse por `target + scenario`.

### Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)


## [v0.8.45] - Backend/Frontend: eliminacion de shims legacy (2026-02-13)
### ♻️ Limpieza (sin compat)
- Eliminados comandos legacy `start_external_audit` / `cancel_external_audit` y eventos `external-audit-*`:
  - backend Tauri solo expone `start_attack_lab` / `cancel_attack_lab` + eventos `attack-lab-*`.
- Eliminados shims legacy de backend:
  - `src-tauri/src/application/legacy/*`
- Eliminados shims legacy de frontend:
  - `src/adapters/externalAuditAdapter.ts`
  - aliases `ExternalAudit*` en `src/shared/dtos/NetworkDTOs.ts`
  - shims de windowing para `panel="external"` y evento `netsentinel://external-context`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)
- `cd src-tauri && cargo test --lib -q` (ok)
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.44] - Backend: Fase 3 (Attack Lab + settings via puertos) (2026-02-13)
### ♻️ Backend (hexagonal real)
- Attack Lab:
  - Tipos movidos a dominio: `src-tauri/src/domain/entities.rs` (`AttackLabRequest`, `AttackLabLogEvent`, `AttackLabExitEvent`).
  - Nuevo puerto runner + sink: `src-tauri/src/domain/ports.rs` (`AttackLabRunnerPort`, `AttackLabEventSinkPort`).
  - Runner real movido a infraestructura: `src-tauri/src/infrastructure/attack_lab/runner.rs` (`TokioProcessAttackLabRunner`).
  - Sink Tauri movido a API: `src-tauri/src/api/sinks/attack_lab_tauri_sink.rs` (emite eventos `attack-lab-*`).
  - `src-tauri/src/application/attack_lab/service.rs` ya no depende de `tauri::AppHandle`.
- Settings:
  - Nuevo `AppSettings` en dominio: `src-tauri/src/domain/entities.rs`.
  - Nuevo puerto `SettingsStorePort`: `src-tauri/src/domain/ports.rs`.
  - Implementacion file-backed: `src-tauri/src/infrastructure/persistence/settings_store.rs` (`FileSettingsStore`).
  - `src-tauri/src/application/settings/service.rs` ahora usa DI via `SettingsStorePort` (sin Tauri/FS directo).
  - `src-tauri/src/application/opsec/service.rs` ya no usa `Mutex<SettingsService>` (mutex interno en SettingsService).

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.43] - Backend: Fase 3 (puertos + DI: scan/opsec/traffic/wordlist) (2026-02-13)
### ♻️ Backend (hexagonal real)
- `domain/ports.rs`: ampliado `NetworkScannerPort` con `probe_tcp_banner()` y nuevo puerto `TrafficSnifferPort`.
- `domain/knowledge/service_dictionary.rs`: movido el diccionario de servicios por puerto fuera de infraestructura.
- `application/scan/service.rs`: ya no depende de `infrastructure/*` (canario via puerto + diccionario en dominio).
- `application/opsec/service.rs`: desacoplado de `api/dtos` e infraestructura (retorna entidad de dominio `MacSecurityStatus`).
- `application/traffic/service.rs`: DI por puertos (`NetworkScannerPort` + `TrafficSnifferPort`) y callback de paquetes (sin Tauri dentro del caso de uso).
- `application/wifi/service.rs`: DI del conector via `WifiConnectorPort` (evita dependencia directa de infraestructura en el caso de uso).
- `api/commands/system.rs`: `get_identity` ahora delega en `OpSecService` y el `traffic-event` se emite desde comandos (presentacion), no desde application.
- `application/wordlist/service.rs`: DI via `WordlistRepositoryPort` (repositorio file implementado en `infrastructure/persistence`).

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.33] - Backend: inicio Fase 1 (application/scan) (2026-02-13)
### ♻️ Backend (estructura)
- Iniciada migracion progresiva de `src-tauri/src/application` a modulos por dominio:
  - Servicio de escaneo movido a `src-tauri/src/application/scan/service.rs`
  - Wrapper legacy mantenido: `src-tauri/src/application/scanner_service.rs`
  - Nuevo modulo: `src-tauri/src/application/scan/mod.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.34] - Backend: Fase 1 (application/history) (2026-02-13)
### ♻️ Backend (estructura)
- Servicio de historial migrado a modulo por dominio:
  - Servicio real: `src-tauri/src/application/history/service.rs`
  - Nuevo modulo: `src-tauri/src/application/history/mod.rs`
  - Wrapper legacy mantenido: `src-tauri/src/application/history_service.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.35] - Backend: Fase 1 (application/snapshot) (2026-02-13)
### ♻️ Backend (estructura)
- Servicio de snapshot migrado a modulo por dominio:
  - Servicio real: `src-tauri/src/application/snapshot/service.rs`
  - Nuevo modulo: `src-tauri/src/application/snapshot/mod.rs`
  - Wrapper legacy mantenido: `src-tauri/src/application/latest_snapshot_service.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.36] - Backend: Fase 1 (application/credentials) (2026-02-13)
### ♻️ Backend (estructura)
- Servicio de credenciales migrado a modulo por dominio:
  - Servicio real: `src-tauri/src/application/credentials/service.rs`
  - Nuevo modulo: `src-tauri/src/application/credentials/mod.rs`
  - Wrapper legacy mantenido: `src-tauri/src/application/credential_service.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.37] - Backend: Fase 1 (wordlist/opsec/settings) (2026-02-13)
### ♻️ Backend (estructura)
- Servicios migrados a modulos por dominio (con wrappers legacy):
  - Wordlist: `src-tauri/src/application/wordlist/service.rs` + `src-tauri/src/application/wordlist/mod.rs`
  - OpSec: `src-tauri/src/application/opsec/service.rs` + `src-tauri/src/application/opsec/mod.rs`
  - Settings: `src-tauri/src/application/settings/service.rs` + `src-tauri/src/application/settings/mod.rs`
- Wrappers legacy mantenidos:
  - `src-tauri/src/application/wordlist_service.rs`
  - `src-tauri/src/application/opsec_service.rs`
  - `src-tauri/src/application/settings_service.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.38] - Backend: Fase 1 (audit/traffic/jammer/mac_changer) (2026-02-13)
### ♻️ Backend (estructura)
- Servicios migrados a modulos por dominio (con wrappers legacy):
  - Audit: `src-tauri/src/application/audit/service.rs` + `src-tauri/src/application/audit/mod.rs`
  - Traffic: `src-tauri/src/application/traffic/service.rs` + `src-tauri/src/application/traffic/mod.rs`
  - Jammer: `src-tauri/src/application/jammer/service.rs` + `src-tauri/src/application/jammer/mod.rs`
  - Mac changer movido bajo OpSec: `src-tauri/src/application/opsec/mac_changer.rs`
- Wrappers legacy mantenidos:
  - `src-tauri/src/application/audit_service.rs`
  - `src-tauri/src/application/traffic_service.rs`
  - `src-tauri/src/application/jammer_service.rs`
  - `src-tauri/src/application/mac_changer_service.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.39] - Backend: Fase 1 (legacy/ + WiFi module) (2026-02-13)
### ♻️ Backend (estructura)
- Centralizada compatibilidad legacy en `src-tauri/src/application/legacy/*` y `application/mod.rs` usa `#[path = \"legacy/...\" ]`:
  - shims: `*_service.rs` y `wifi_normalizer.rs`
- WiFi migrado a modulo por dominio:
  - Servicio real: `src-tauri/src/application/wifi/service.rs`
  - Normalizador real: `src-tauri/src/application/wifi/normalizer.rs`
  - Modulo: `src-tauri/src/application/wifi/mod.rs`
  - Wrappers legacy: `src-tauri/src/application/legacy/wifi_service.rs`, `src-tauri/src/application/legacy/wifi_normalizer.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.40] - Backend: API commands legacy (external_audit) (2026-02-13)
### ♻️ Backend (estructura)
- Comandos legacy de API movidos a carpeta `legacy/`:
  - `src-tauri/src/api/commands/legacy/external_audit.rs`
- `src-tauri/src/api/commands.rs` actualizado para referenciar el nuevo path.

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.41] - Backend: reducir dependencia de shims legacy (2026-02-13)
### ♻️ Backend (mantenibilidad)
- Wiring interno actualizado para depender de modulos reales (`application::<dominio>`) en vez de `application::<shim>_service`:
  - `src-tauri/src/lib.rs`
  - `src-tauri/src/api/state.rs`
  - `src-tauri/src/api/commands.rs`
  - `src-tauri/src/api/commands/*`
- OpSec ahora referencia Settings/MacChanger por modulos reales:
  - `src-tauri/src/application/opsec/service.rs`
- Shims legacy anotados para evitar warnings cuando no se usan en el crate:
  - `src-tauri/src/application/legacy/*.rs`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.42] - Docs: paths backend actualizados (2026-02-13)
### 📝 Documentacion
- Actualizados paths y estructura backend por dominios/legacy:
  - `docs/ARCHITECTURE.md`
  - `docs/BACKEND_REFACTOR_GUIDE.md`
  - `docs/RADAR_VIEW.md`
  - `docs/ATTACK_LAB.md`
  - `docs/TESTING.md`
  - `docs/REFACTOR_AUDIT.md`
- Nota operativa de shims:
  - `src-tauri/src/application/legacy/README.md`

### ✅ Validaciones
- `cd src-tauri && cargo check` (ok)

## [v0.8.31] - Reestructura frontend: History por feature (2026-02-13)
### ♻️ Frontend (estructura y separacion de responsabilidades)
- History movido a feature-folder:
  - `src/ui/features/history/components/HistoryPanel.tsx`
- Layouts/tests actualizados para el nuevo path:
  - `src/ui/components/layout/MainDockedLayout.tsx`
  - `src/__tests__/App.panels.test.tsx`
  - `src/__tests__/App.integration.test.tsx`

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.32] - Limpieza frontend: cabeceras obligatorias + logs de debug (2026-02-13)
### ♻️ Frontend (mantenibilidad)
- Eliminado `console.log/debug` en runtime de UI (ahora `uiLogger.info` solo en DEV) y normalizados errores:
  - `src/App.tsx`
  - `src/ui/hooks/modules/ui/usePanelDockingState.ts`
  - `src/ui/features/attack_lab/hooks/useAttackLabDetachedSync.ts`
  - `src/ui/features/radar/components/radar/RadarIntelPanel.tsx`
  - `src/ui/features/device_detail/hooks/useDeviceDetailPanelState.ts`
  - `src/ui/features/wordlist/hooks/useWordlistManager.ts`
- Cabecera aplicada a todos los `.ts/.tsx` bajo `src/ui` (ruta + descripcion en las dos primeras lineas).

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.27] - Reestructura frontend: Radar + Console Logs por feature (2026-02-13)
### ♻️ Frontend (estructura y separacion de responsabilidades)
- Radar movido a feature-folder:
  - `src/ui/features/radar/components/*`
  - `src/ui/features/radar/hooks/*`
  - tests: `src/ui/features/radar/__tests__/*`
- Console Logs movido a feature-folder:
  - `src/ui/features/console_logs/components/*`
  - `src/ui/features/console_logs/hooks/*`
  - tests: `src/ui/features/console_logs/__tests__/*`
- Integracion actualizada en layouts:
  - `src/ui/components/layout/MainDockedLayout.tsx`
  - `src/ui/components/layout/DetachedPanelView.tsx`

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.28] - Reestructura frontend: Device Detail por feature (2026-02-13)
### ♻️ Frontend (estructura y separacion de responsabilidades)
- Device Detail movido a feature-folder:
  - `src/ui/features/device_detail/components/DeviceDetailPanel.tsx`
  - `src/ui/features/device_detail/hooks/useDeviceDetailPanelState.ts`
  - tests: `src/ui/features/device_detail/__tests__/*`
- Layouts actualizados para lazy-load del panel:
  - `src/ui/components/layout/MainDockedLayout.tsx`
  - `src/ui/components/layout/DetachedPanelView.tsx`

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.29] - Reestructura frontend: Traffic por feature (2026-02-13)
### ♻️ Frontend (estructura y separacion de responsabilidades)
- Traffic movido a feature-folder:
  - `src/ui/features/traffic/components/*`
  - `src/ui/features/traffic/hooks/*`
  - tests: `src/ui/features/traffic/__tests__/*`
- Console Logs ahora consume `TrafficPanel` desde la feature `traffic`.

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.30] - Reestructura frontend: Scene3D por feature (2026-02-13)
### ♻️ Frontend (estructura y separacion de responsabilidades)
- Scene3D movido a feature-folder:
  - `src/ui/features/scene3d/components/*`
  - `src/ui/features/scene3d/hooks/*`
  - tests: `src/ui/features/scene3d/__tests__/*`
- Layouts actualizados para lazy-load de `NetworkScene`:
  - `src/ui/components/layout/MainDockedLayout.tsx`
  - `src/ui/components/layout/DetachedPanelView.tsx`

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.8.26] - Renombrado External Audit -> Attack Lab + reestructura por feature (2026-02-13)
### ♻️ Frontend (estructura y naming)
- Nuevo feature-folder: `src/ui/features/attack_lab/*` (panel + hooks + catalogo + tests).
- Docking/windowing renombrado a `attack_lab` con compatibilidad legacy:
  - contexto principal: `netsentinel://attack-lab-context`
  - compat: `netsentinel://external-context`
  - nota: la compatibilidad legacy se elimino en `v0.8.45`.

### 🦀 Backend (Tauri / application)
- Modulo application renombrado a `src-tauri/src/application/attack_lab/*`.
- Nuevos comandos Tauri:
  - `start_attack_lab`, `cancel_attack_lab`
  - alias legacy mantenido: `start_external_audit`, `cancel_external_audit`
- Nuevos eventos:
  - `attack-lab-log`, `attack-lab-exit`
  - alias legacy mantenido: `external-audit-log`, `external-audit-exit`

### 📚 Documentacion
- Renombrados docs: `docs/ATTACK_LAB.md`, `docs/ATTACK_LAB_REFACTOR.md`.
- `AGENTS.md` actualizado con la nueva regla de cabecera por archivo (ruta + descripcion).

## [v0.8.25] - Hardening de conexion WiFi real (2026-02-12)
### 🦀 Backend (validacion de enlace)
- Refactor en `src-tauri/src/infrastructure/wifi/wifi_connector.rs` para eliminar falsos positivos de conexion:
  - desconexion explicita previa (`netsh wlan disconnect`) antes de cada intento,
  - validacion estricta por estado real de interfaz (`connected/conectado`) y SSID exacto.
- `src-tauri/src/infrastructure/wifi/windows_netsh.rs` ajusta la marca de red conectada para depender tambien de `iface.is_connected`.
- `src-tauri/src/infrastructure/wifi/windows_netsh/parse_interfaces.rs` ahora parsea correctamente multiples bloques de interfaz y prioriza el bloque realmente conectado.
- `src-tauri/src/infrastructure/wifi/wifi_connector.rs` deja de exigir IPv4 para declarar enlace WiFi exitoso (evita falsos negativos por latencia DHCP).
- Añadidas trazas de diagnostico en el flujo nativo WiFi:
  - `src/core/logic/externalAuditScenarios.ts` ahora loguea tiempo por intento y snapshot `scan_airwaves` tras cada fallo.
  - `src-tauri/src/infrastructure/wifi/wifi_connector.rs` ahora loguea estado de `netsh connect` y snapshots de interfaz durante el polling.
- UX/logging en `ExternalAudit`:
  - nuevas trazas `🧪 TRACE` redirigidas a `SYSTEM LOGS` por bus local (`src/ui/utils/systemLogBus.ts`) para limpiar el `Console Output` del panel.
  - `src/ui/hooks/modules/network/useSocketLogs.ts` ahora escucha ese bus y persiste eventos de sistema con timestamp.
- `src/ui/features/attack_lab/panel/AuditConsole.tsx` renderiza salida de forma progresiva (stagger) para evitar bloque visual al autorizar.
  - `src/ui/components/shared/CyberConfirmModal.tsx` añade estado `isLoading` para mostrar el modal OPSEC de inmediato mientras se resuelve `check_mac_security`.
- Impacto: `wifi_connect` solo devuelve `true` cuando hay enlace WiFi realmente establecido sobre el SSID objetivo, evitando continuar el flujo por falsos negativos de parseo o demora DHCP.

## [v0.8.24] - Fix de corte en diccionario WiFi (2026-02-12)
### 🦀 Backend (WiFi connector)
- Corregida la verificacion de conexion en `src-tauri/src/infrastructure/wifi/wifi_connector.rs` para no depender solo de salida en ingles de `netsh`.
- `is_connected(...)` ahora reconoce estado conectado en ingles y espanol (`connected` / `conectado`) y normaliza comparacion por minusculas.
- Impacto: cuando se acierta la clave WPA2, `wifi_connect` devuelve `true` correctamente y el escenario `wifi_brute_force_dict` corta el bucle con `return` en el primer acierto.
