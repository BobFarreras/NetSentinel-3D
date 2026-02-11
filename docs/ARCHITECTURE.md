<!-- docs/ARCHITECTURE.md -->

# Arquitectura Tecnica de NetSentinel 3D

## 1. Vision General
NetSentinel 3D es una aplicacion desktop defensiva con arquitectura hibrida:
- Frontend: React + TypeScript (visualizacion, estado de UI y experiencia de usuario).
- Backend: Rust + Tauri (logica de red, auditoria, persistencia y acceso al sistema).
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
- `src/ui/components/hud/*`: paneles HUD (Radar, DeviceDetail, History, ExternalAudit).
- `src/ui/components/panels/*`: consola/logs/trafico.
- `src/ui/components/3d/*`: escena de red (nodos, labels, camara, controles).
- `src/ui/hooks/modules/*`: hooks de estado por modulo/panel/escena.

Regla practica:
- Si un componente supera responsabilidad de presentacion, extraer hook `useXxxState` y sub-vistas.

## 3. Capas del Backend (Rust)
### 3.1 Domain
Ubicacion: `src-tauri/src/domain`
- `entities.rs`: modelos de dominio (`Device`, `OpenPort`, `ScanSession`, etc.).
- `ports.rs`: contratos de abstraccion para infraestructura.
- Nota: el dominio debe mantenerse lo mas "puro" posible (sin I/O ni dependencias de Tauri).

### 3.2 Application
Ubicacion: `src-tauri/src/application`
- `scanner_service.rs`: descubrimiento de red y auditoria de puertos.
- `audit_service.rs`: auditoria de router y extraccion de datos.
- `history_service.rs`: guardado y lectura de sesiones.
- `traffic_service.rs`: control del monitor de trafico.
- `jammer_service.rs`: contramedidas activas.
- `wifi_service.rs`: orquestacion de Radar View (WiFi) + normalizacion.
  - normalizacion pura en `wifi_normalizer.rs`.
- `external_audit/*`: wrapper de ejecucion de herramientas externas (stdout/stderr en tiempo real).

### 3.3 Infrastructure
Ubicacion: `src-tauri/src/infrastructure`
- `system_scanner.rs`: adaptador del puerto `NetworkScannerPort` (orquesta submodulos en `system_scanner/*`).
- `router_audit/*`: automatizacion de auditoria de gateway (Chrome) + parsing con fixtures.
- `fs_repository.rs`: persistencia en disco.
- `network/*`: sniffing, ARP, puertos, vendor/hostname resolver, etc.
  - `network/vendor_resolver*`: resolucion de fabricante por OUI (seed embebido + override en AppData).
- `wifi/*`: escaneo WiFi por SO (Windows `netsh`, fallback `wifiscanner`) + fixtures.
- `repositories/local_intelligence*`: identidad local del host (PowerShell + parsing con fixtures y cache corto).

### 3.4 API (Tauri commands)
Ubicacion: `src-tauri/src/api` y `src-tauri/src/lib.rs`
- `api/commands.rs`: fachada de comandos (`#[tauri::command]`) y delegacion a `api/commands/*` por dominio.
  - Importante: los atributos `#[tauri::command]` viven en `api/commands.rs` para que `generate_handler!` encuentre los `__cmd__*`.
- `api/state.rs`: estados gestionados por Tauri (`TrafficState`, `JammerState`).
- `lib.rs`: wiring de dependencias (infra -> application) y registro de comandos en `invoke_handler`.

## 4. Flujo Frontend <-> Backend
Flujo tipico de comando:
1. Un hook UI llama a un adapter.
2. El adapter ejecuta `invoke("comando_tauri", payload)`.
3. Tauri despacha al comando Rust registrado.
4. El comando usa servicios de application.
5. Application delega en infrastructure (si procede).
6. Rust devuelve DTO serializado al frontend.
7. El hook actualiza estado y la UI renderiza.

Flujo tipico de eventos:
1. Backend emite eventos (`traffic-event`, `audit-log`).
2. Hook frontend escucha con `listen(...)`.
3. El hook transforma payload y actualiza estado incremental.

Nota de frontend (estado global):
- `useNetworkManager` actua como orquestador de alto nivel.
- El bootstrap de arranque (identidad, auto-scan y sync con gateway) se aisla en `src/ui/hooks/modules/network/useBootstrapNetwork.ts` para reducir acoplamiento.
- Los hooks modulares se agrupan por dominio en `src/ui/hooks/modules/*`:
  - `network/`, `radar/`, `traffic/`, `ui/`, `scene3d/`, `shared/`.

## 4.2 Multiwindow y paneles desacoplados (Tauri)
Fuente de verdad:
- `src/App.tsx`
- `src/adapters/windowingAdapter.ts`
- `src-tauri/capabilities/default.json`

Comportamiento actual:
1. Cada panel (`console`, `device`, `radar`, `external`, `scene3d`) se puede desacoplar.
2. En desktop Tauri se abre ventana nativa (`WebviewWindow`) fuera de la ventana principal.
3. Si falla runtime Tauri (web/tests), hay fallback por `DetachedWindowPortal`.
4. El cierre oficial en desacoplado es por `X` nativo del sistema.
5. Al cerrar ventana desacoplada:
   - se emite `netsentinel://dock-panel` via `pagehide`,
   - la principal reacopla y limpia estado detached.

Eventos internos de coordinacion:
- `netsentinel://dock-panel`: reacople generico de panel.
- `netsentinel://external-context`: sincroniza target/escenario/autorun del panel `External` desacoplado.

Reglas de layout actuales:
- Si `scene3d` esta desacoplada, `Radar/External` ocupan todo el ancho de la zona superior.
- Si `console` esta desacoplada, la zona inferior y su resizer se ocultan.
- Si `device` esta desacoplada, sidebar y resizer derecho se ocultan.

## 4.1 Patron Frontend Modular (actual)
Para reducir componentes "god file" y facilitar testeo, el frontend sigue un patron estable:
- `PanelContenedor`: compone sub-vistas y conecta callbacks.
- `useXxxPanelState`: concentra estado, efectos y memos del panel.
- `Subvistas`: renderizan UI pura y reciben props.
- `styles/tokens`: colores, tipografia y constantes visuales compartidas.

Ejemplos aplicados:
- Radar:
  - `src/ui/components/hud/RadarPanel.tsx`
  - `src/ui/hooks/modules/radar/useRadarPanelState.ts`
  - `src/ui/components/hud/radar/*`
- Console Logs:
  - `src/ui/components/panels/ConsoleLogs.tsx`
  - `src/ui/hooks/modules/ui/useConsoleLogsState.ts`
  - `src/ui/components/panels/console_logs/*`
- Traffic:
  - `src/ui/components/panels/TrafficPanel.tsx`
  - `src/ui/hooks/modules/traffic/useTrafficPanelState.ts`
  - `src/ui/components/panels/traffic/*`
- Device Detail:
  - `src/ui/components/hud/DeviceDetailPanel.tsx`
  - `src/ui/hooks/modules/ui/useDeviceDetailPanelState.ts`
- Escena 3D:
  - `src/ui/components/3d/NetworkScene.tsx`
  - `src/ui/components/3d/NetworkNode.tsx`
  - `src/ui/components/3d/NodeLabel.tsx`
  - `src/ui/hooks/modules/scene3d/useNetworkSceneState.ts`
  - `src/ui/hooks/modules/scene3d/useNetworkNodeState.ts`
  - `src/ui/hooks/modules/scene3d/useNodeLabelState.ts`

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
- `start_external_audit`
- `cancel_external_audit`

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
- Si se decide una excepcion por compatibilidad, documentarla explicitamente en el DTO afectado.

## 7. Estado de Calidad y Riesgos Tecnicos
### 7.1 Validaciones disponibles
- Frontend:
  - `npm test -- --run`
  - `npm run build`
- Backend:
  - `cargo check` en `src-tauri`
  - `cargo test` en `src-tauri` (si el entorno de linking lo permite)

### 7.2 Limitacion actual en Windows
- `cargo test` puede fallar por linking de `Packet.lib` (dependencia nativa de captura/red).
- Mientras no se resuelva el entorno nativo, usar `cargo check` como validacion minima de backend.

### 7.3 Deuda tecnica visible
- Hay zonas con naming mixto y discrepancias puntuales entre DTOs Rust/TS.
- Existen warnings puntuales que conviene limpiar para mejorar mantenibilidad.

## 8. Principios de Evolucion
- Mantener frontend delgado y backend fuerte.
- Introducir cambios por capa, no por archivos aislados.
- Priorizar contratos estables y tests reproducibles.
- Documentar siempre comandos nuevos y eventos nuevos el mismo dia en que se implementan.
- En frontend, preferir refactor incremental por panel:
  - 1) extraer hook de estado,
  - 2) partir sub-vistas puras,
  - 3) centralizar tokens visuales,
  - 4) cubrir hook con tests unitarios.
