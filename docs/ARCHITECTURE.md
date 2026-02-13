<!-- docs/ARCHITECTURE.md -->
<!-- Descripcion: mapa de capas, flujo de datos y convenciones estructurales del repo (frontend + backend). -->

# Arquitectura Tecnica de NetSentinel 3D

## 1. Vision General

NetSentinel 3D es una aplicacion desktop defensiva con arquitectura hibrida:

- Frontend: React + TypeScript (visualizacion, estado de UI y experiencia de
  usuario).
- Backend: Rust + Tauri (logica de red, auditoria, persistencia y acceso al
  sistema).
- Transporte: IPC de Tauri (`invoke` + eventos) con DTOs tipados.

Principio base:

- El frontend no ejecuta operaciones de red de bajo nivel.
- El backend expone comandos explicitos y controlados.

## 2. Estructura Real del Repositorio

```text
/src
|- /adapters                # Llamadas IPC al backend (invoke)
|- /shared/dtos             # Contratos TypeScript compartidos
|- /ui/components           # Componentes de interfaz
|- /ui/hooks                # Orquestacion de estado y casos de uso UI
|- /core/logic              # Logica pura de frontend (ej: deteccion de intrusos)
\- /test                    # Setup de Vitest

/src-tauri/src
|- /api                     # Comandos Tauri + DTOs de salida
|- /application             # Casos de uso (servicios)
|- /domain                  # Entidades y puertos
\- /infrastructure          # Implementaciones concretas (red, fs, auditoria)
```

### 2.1 Estructura frontend por feature (actual)

- `src/ui/features/*`: feature-folders (UI + hooks + tests) para funcionalidades
  completas.
  - Ejemplos: `attack_lab/`, `radar/`, `console_logs/`.
- `src/ui/components/*`: componentes compartidos y/o legacy en transicion.
  - `hud/`, `panels/`, `3d/`.
- `src/ui/hooks/modules/*`: hooks compartidos/legacy por dominio (network,
  traffic, scene3d, ui, etc.).

Regla practica:

- Si un componente supera responsabilidad de presentacion, extraer hook
  `useXxxState` y sub-vistas.

Convencion de documentacion:

- Cada feature-folder principal debe tener `README.md` propio con un resumen y
  una seccion de interconexiones (comandos, eventos, DTOs y entrypoints). Ver
  `docs/FEATURE_README_TEMPLATE.md`.
- Para tareas recurrentes, el repo versiona *skills* en `skills/` con guias
  accionables (SKILL.md) que se cargan on-demand (discovery/activacion).

## 3. Capas del Backend (Rust)

### 3.1 Domain

Ubicacion: `src-tauri/src/domain`

- `entities.rs`: modelos de dominio (`Device`, `OpenPort`, `ScanSession`, etc.).
- `ports.rs`: contratos de abstraccion para infraestructura.
- Nota: el dominio debe mantenerse lo mas "puro" posible (sin I/O ni
  dependencias de Tauri).

### 3.2 Application

Ubicacion: `src-tauri/src/application`

Application ya no es plana: se organiza por dominios/skills (feature-folders).

- `scan/*`: descubrimiento de red + auditoria de puertos (`scan/service.rs`).
- `audit/*`: auditoria de gateway y extraccion de inventario (`audit/service.rs`).
- `history/*`: guardado/lectura de sesiones (`history/service.rs`).
- `snapshot/*`: persistencia/carga del ultimo snapshot (`snapshot/service.rs`).
- `credentials/*`: credenciales del gateway (`credentials/service.rs`).
- `traffic/*`: control del monitor de trafico (`traffic/service.rs`).
- `jammer/*`: contramedidas activas (`jammer/service.rs`).
- `wifi/*`: Radar View (WiFi) + normalizacion:
  - servicio: `wifi/service.rs`
  - normalizador: `wifi/normalizer.rs`
- `attack_lab/*`: wrapper de ejecucion de herramientas externas (Attack Lab)
  (stdout/stderr en tiempo real).
- `opsec/*`: seguridad operacional:
  - `opsec/service.rs`: orquestador (check_mac_security, randomize_mac)
  - `opsec/mac_changer.rs`: randomizacion MAC (Windows)
- `settings/*`: persistencia de configuracion local (MAC original, etc.).

Compatibilidad:

- `legacy/*`: shims `*_service.rs` para mantener imports historicos mientras se migra el wiring interno.

### 3.3 Infrastructure

Ubicacion: `src-tauri/src/infrastructure`

- `system_scanner/`: adaptador del puerto `NetworkScannerPort` (orquesta
  submodulos en `system_scanner/*`).
- `router_audit/*`: automatizacion de auditoria de gateway (Chrome) + parsing
  con fixtures.
- `persistence/*`: persistencia en disco (history/snapshot/settings/wordlist + credential store).
- `network/*`: sniffing, ARP, puertos, vendor/hostname resolver, etc.
  - `network/vendor_resolver*`: resolucion de fabricante por OUI (seed
    embebido + override en AppData).
- `wifi/*`: escaneo WiFi por SO (Windows `netsh`, fallback `wifiscanner`) +
  fixtures.
- `repositories/local_intelligence*`: identidad local del host (PowerShell +
  parsing con fixtures y cache corto).

### 3.4 API (Tauri commands)

Ubicacion: `src-tauri/src/api` y `src-tauri/src/lib.rs`

- `api/commands.rs`: fachada de comandos (`#[tauri::command]`) y delegacion a
  `api/commands/*` por dominio.
  - Importante: los atributos `#[tauri::command]` viven en `api/commands.rs`
    para que `generate_handler!` encuentre los `__cmd__*`.
- `api/state.rs`: estados gestionados por Tauri (`TrafficState`, `JammerState`).
  - `TrafficState`: `Mutex<TrafficService>` (control directo start/stop).
  - `JammerState`: `Arc<JammerService>` (sin mutex global en ruta de comando).
- `lib.rs`: wiring de dependencias (infra -> application) y registro de comandos
  en `invoke_handler`.

### 3.5 Modelo de Seguridad y Privilegios (NUEVO)

NetSentinel requiere elevacion de privilegios para operaciones
ofensivas/defensivas de bajo nivel:

- **Manifest**: `src-tauri/app.manifest` fuerza `requireAdministrator`.
- **Registry**: Manipulacion de `HKLM\SOFTWARE\Microsoft\WlanSvc` para MAC
  Randomization.
- **PowerShell**: Ejecucion de scripts via `std::process::Command` con flags de
  ocultacion de ventana.

## 4. Flujo Frontend <-> Backend

Flujo tipico de comando:

1. Un hook UI llama a un adapter.
2. El adapter ejecuta `invoke("comando_tauri", payload)`.
3. Tauri despacha al comando Rust registrado.
4. El comando usa servicios de application.
5. Application delega en infrastructure (si procede).
6. Rust devuelve DTO serializado al frontend.
7. El hook actualiza estado y la UI renderiza.

### 4.4 Ruta runtime de Jamming (post-incidente 2026-02-11)

Problema observado:

- La app podia congelarse al activar `start_jamming` por contencion en estado
  compartido + trabajo pesado en ruta caliente.

Solucion aplicada:

1. `start_jamming/stop_jamming` encolan comandos y retornan inmediato.
2. `JammerService` opera en modo actor (`mpsc`):
   - un hilo dedicado consume `Start/Stop`,
   - ese hilo es el unico owner de `active_targets`.
3. Se evita recalculo continuo de identidad/interfaz:
   - cache de interfaz en loop,
   - refresh periodico (15s), no por iteracion.

Reglas para no reintroducir el bug:

- No poner `Mutex` global alrededor de `JammerService` en comandos Tauri.
- No recalcular `get_host_identity()` en cada tick del loop de inyeccion.
- No abrir/cerrar recursos pesados por paquete; reutilizar estado del worker.
- En ruta de comando, hacer solo validacion + encolado (sin I/O bloqueante).

Flujo tipico de eventos:

1. Backend emite eventos (`traffic-event`, `audit-log`).
2. Hook frontend escucha con `listen(...)`.
3. El hook transforma payload y actualiza estado incremental.

Nota de frontend (estado global):

- `useNetworkManager` actua como orquestador de alto nivel.
- El bootstrap de arranque (identidad, auto-scan y sync con gateway) se aisla en
  `src/ui/hooks/modules/network/useBootstrapNetwork.ts` para reducir
  acoplamiento.
- Los hooks modulares se agrupan por dominio en `src/ui/hooks/modules/*`:
  - `network/`, `radar/`, `traffic/`, `ui/`, `scene3d/`, `shared/`.
- `App.tsx` queda como orquestador fino:
  - delega layout acoplado en `src/ui/components/layout/MainDockedLayout.tsx`,
  - delega modo desacoplado en `src/ui/components/layout/DetachedPanelView.tsx`,
  - delega logica de UI multiwindow en hooks `ui/*`.

### 4.5 Flujo de GHOST MODE (OpSec)

1. Usuario solicita "Ghost Mode" en `DeviceDetailPanel`.
2. Frontend abre `ConsoleDisplay` en modo interactivo (Prompt).
3. Al confirmar, llama a `randomize_mac`.
4. Backend (Rust) ejecuta script PowerShell sobre `WlanSvc`.
5. Adaptador de red se reinicia.
6. Frontend valida nueva identidad mediante `check_mac_security`.
7. Si la MAC es LAA (Locally Administered), el `CyberConfirmModal` muestra
   estado VERDE.

## 4.2 Multiwindow y paneles desacoplados (Tauri)

Fuente de verdad:

- `src/App.tsx`
- `src/adapters/windowingAdapter.ts`
- `src-tauri/capabilities/default.json`

Comportamiento actual:

1. Cada panel (`console`, `device`, `radar`, `external`, `scene3d`) se puede
   desacoplar.
2. En desktop Tauri se abre ventana nativa (`WebviewWindow`) fuera de la ventana
   principal.
3. Si falla runtime Tauri (web/tests), hay fallback por `DetachedWindowPortal`.
4. El cierre oficial en desacoplado es por `X` nativo del sistema.
5. Al cerrar ventana desacoplada:
   - se emite `netsentinel://dock-panel` via `pagehide`,
   - la principal reacopla y limpia estado detached.

Eventos internos de coordinacion:

- `netsentinel://dock-panel`: reacople generico de panel.
- `netsentinel://attack-lab-context`: sincroniza target/escenario/autorun del
  panel de auditoria desacoplado (feature: Attack Lab).
  - compat legacy: `netsentinel://external-context`.

Hooks UI dedicados de esta capa:

- `src/ui/hooks/modules/ui/useAppLayoutState.ts`:
  - estado y handlers de resizers (`sidebar/console/radar/dock_split`).
- `src/ui/hooks/modules/ui/usePanelDockingState.ts`:
  - estado `detachedPanels/detachedModes`,
  - undock/dock,
  - reconciliacion de ventanas Tauri y cierre contextual de paneles.
- `src/ui/hooks/modules/ui/useDetachedRuntime.ts`:
  - arranque diferido de ventana detached,
  - emision de reacople en `pagehide`.
- `src/ui/hooks/modules/ui/useExternalDetachedSync.ts`:
  - sincronizacion en caliente de `targetDevice/scenarioId/autoRun` para
    `External`.

Reglas de layout actuales:

- Si `scene3d` esta desacoplada, `Radar/External` ocupan todo el ancho de la
  zona superior.
- Si `console` esta desacoplada, la zona inferior y su resizer se ocultan.
- Si `device` esta desacoplada, sidebar y resizer derecho se ocultan.

## 4.1 Patron Frontend Modular (actual)

Para reducir componentes "god file" y facilitar testeo, el frontend sigue un
patron estable:

- `PanelContenedor`: compone sub-vistas y conecta callbacks.
- `useXxxPanelState`: concentra estado, efectos y memos del panel.
- `Subvistas`: renderizan UI pura y reciben props.
- `styles/tokens`: colores, tipografia y constantes visuales compartidas.

Ejemplos aplicados:

- Radar:
  - `src/ui/features/radar/components/RadarPanel.tsx`
  - `src/ui/features/radar/hooks/useRadarPanelState.ts`
  - `src/ui/features/radar/components/radar/*`
- Console Logs:
  - `src/ui/features/console_logs/components/ConsoleLogs.tsx`
  - `src/ui/features/console_logs/hooks/useConsoleLogsState.ts`
  - `src/ui/features/console_logs/components/*`
- Traffic:
  - `src/ui/features/traffic/components/TrafficPanel.tsx`
  - `src/ui/features/traffic/hooks/useTrafficPanelState.ts`
  - `src/ui/features/traffic/hooks/useTrafficMonitor.ts`
  - `src/ui/features/traffic/components/*`
- Attack Lab (LAB/CUSTOM):
  - `src/ui/features/attack_lab/panel/AttackLabPanel.tsx`
  - `src/ui/features/attack_lab/hooks/useAttackLab.ts`
  - catalogo LAB: `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`
- History:
  - `src/ui/features/history/components/HistoryPanel.tsx`
- Wordlists (shared):
  - `src/ui/features/wordlist/hooks/useWordlistManager.ts`
- Device Detail:
  - `src/ui/features/device_detail/components/DeviceDetailPanel.tsx`
  - `src/ui/features/device_detail/hooks/useDeviceDetailPanelState.ts`
- Escena 3D:
  - `src/ui/features/scene3d/components/NetworkScene.tsx`
  - `src/ui/features/scene3d/components/NetworkNode.tsx`
  - `src/ui/features/scene3d/components/NodeLabel.tsx`
  - `src/ui/features/scene3d/components/sceneTokens.ts`
  - `src/ui/features/scene3d/hooks/useNetworkSceneState.ts`
  - `src/ui/features/scene3d/hooks/useNetworkNodeState.ts`
  - `src/ui/features/scene3d/hooks/useNodeLabelState.ts`

Beneficios:

- Menos acoplamiento entre render y logica.
- Tests unitarios mas directos por hook.
- Cambios visuales mas seguros al estar aislados por sub-vista.

Diagrama rapido (UI 3D + HUD):

```text
NetworkScene (composicion)
  -> useNetworkSceneState (estado/derivadas)
  -> NetworkNode (presentacion nodo)
      -> useNetworkNodeState (hover/click/animacion)
  -> NodeLabel (presentacion label)
      -> useNodeLabelState (paleta/confianza)

Seleccion de nodo (onDeviceSelect)
  -> useNetworkManager.selectDevice
  -> DeviceDetailPanel (detalle)
  -> ConsoleLogs (filtro por target / trazabilidad)
```

## 5. Mapa de Comandos Actuales

Fuente de verdad: `src-tauri/src/lib.rs` + `src-tauri/src/api/commands.rs`

Comandos de red y auditoria:

- `scan_network`
- `audit_target`
- `audit_router`
- `fetch_router_devices`

Comandos de historial:

- `save_scan`
- `get_history`
- `save_latest_snapshot`
- `load_latest_snapshot`
- `save_gateway_credentials`
- `get_gateway_credentials`
- `delete_gateway_credentials`

Comandos de sistema/tiempo real:

- `get_identity`
- `start_traffic_sniffing`
- `stop_traffic_sniffing`
- `start_jamming`
- `stop_jamming`

Comandos de WiFi (Radar View):

- `scan_airwaves` (ver `docs/RADAR_VIEW.md`).

Comandos de auditoria externa (wrapper CLI):

- `start_attack_lab`
- `cancel_attack_lab`

Regla de mantenimiento:

- Cualquier cambio en comandos debe actualizar en el mismo commit:
  - adapters frontend
  - DTOs compartidos
  - documentacion (`AGENTS.md`, `ARCHITECTURE.md`, `SECURITY.md` si aplica)

## 6. Contratos y Type Safety

Contratos principales:

- Rust: `src-tauri/src/domain/entities.rs` y `src-tauri/src/api/dtos.rs`
- TypeScript: `src/shared/dtos/NetworkDTOs.ts`

Regla:

- Evitar divergencia de nombres (`camelCase`/`snake_case`) y tipos.
- Si se decide una excepcion por compatibilidad, documentarla explicitamente en
  el DTO afectado.

## 7. Estado de Calidad y Riesgos Tecnicos

### 7.1 Validaciones disponibles

- Frontend:
  - `npm test -- --run`
  - `npm run build`
- Backend:
  - `cargo check` en `src-tauri`
  - `cargo test` en `src-tauri` (si el entorno de linking lo permite)

### 7.2 Limitacion actual en Windows

- `cargo test` puede fallar por linking de `Packet.lib` (dependencia nativa de
  captura/red).
- Mientras no se resuelva el entorno nativo, usar `cargo check` como validacion
  minima de backend.

### 7.3 Deuda tecnica visible

- Hay zonas con naming mixto y discrepancias puntuales entre DTOs Rust/TS.
- Existen warnings puntuales que conviene limpiar para mejorar mantenibilidad.

## 8. Principios de Evolucion

- Mantener frontend delgado y backend fuerte.
- Introducir cambios por capa, no por archivos aislados.
- Priorizar contratos estables y tests reproducibles.
- Documentar siempre comandos nuevos y eventos nuevos el mismo dia en que se
  implementan.
- En frontend, preferir refactor incremental por panel:
  -
    1. extraer hook de estado,
  -
    2. partir sub-vistas puras,
  -
    3. centralizar tokens visuales,
  -
    4. cubrir hook con tests unitarios.
