# Diario de desarrollo (CHANGELOG)

Todos los cambios notables en NetSentinel deben documentarse aqui.

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

## [v0.8.26] - Renombrado External Audit -> Attack Lab + reestructura por feature (2026-02-13)
### ♻️ Frontend (estructura y naming)
- Nuevo feature-folder: `src/ui/features/attack_lab/*` (panel + hooks + catalogo + tests).
- Docking/windowing renombrado a `attack_lab` con compatibilidad legacy:
  - contexto principal: `netsentinel://attack-lab-context`
  - compat: `netsentinel://external-context`

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
  - `src/ui/components/panels/external_audit/AuditConsole.tsx` renderiza salida de forma progresiva (stagger) para evitar bloque visual al autorizar.
  - `src/ui/components/shared/CyberConfirmModal.tsx` añade estado `isLoading` para mostrar el modal OPSEC de inmediato mientras se resuelve `check_mac_security`.
- Impacto: `wifi_connect` solo devuelve `true` cuando hay enlace WiFi realmente establecido sobre el SSID objetivo, evitando continuar el flujo por falsos negativos de parseo o demora DHCP.

## [v0.8.24] - Fix de corte en diccionario WiFi (2026-02-12)
### 🦀 Backend (WiFi connector)
- Corregida la verificacion de conexion en `src-tauri/src/infrastructure/wifi/wifi_connector.rs` para no depender solo de salida en ingles de `netsh`.
- `is_connected(...)` ahora reconoce estado conectado en ingles y espanol (`connected` / `conectado`) y normaliza comparacion por minusculas.
- Impacto: cuando se acierta la clave WPA2, `wifi_connect` devuelve `true` correctamente y el escenario `wifi_brute_force_dict` corta el bucle con `return` en el primer acierto.

## [0.8.23] - OpSec & Ghost Mode Implementation
### Added
- **Ghost Mode:** Capacidad de rotar la dirección MAC aleatoriamente usando la configuración nativa de Windows (WlanSvc).
- **Interactive Console:** El panel de detalles ahora soporta prompts interactivos (Yes/No) controlados por teclado.
- **OpSec Modal:** Visualización de riesgo de identidad (Rojo/Verde) antes de ejecutar ataques activos.
- **Admin Elevation:** Implementado `app.manifest` para solicitar permisos de administrador automáticamente.

### Technical
- Nuevo servicio `MacChangerService` con lógica robusta de PowerShell.
- Integración de crate `default-net` v0.22.0 para introspección de interfaces.
- Solución a bloqueos de drivers MediaTek mediante manipulación de Registro en lugar de llamadas directas al driver.

## [v0.8.22] - Hardening de Kill Net + E2E de jammer (2026-02-11)
### 🛡️ Frontend (jammer)
- Refactor de `useJamming` para evitar bloqueos por reentrada:
  - nuevo estado `jamPendingDevices` por IP objetivo,
  - bloqueo de doble click mientras `start_jamming/stop_jamming` esta en vuelo,
  - timeout defensivo de comandos Tauri (`5s`) para evitar espera infinita en UI,
  - bloqueo explicito cuando el target es gateway (`JAMMER BLOQUEADO`).
- `useNetworkManager` expone `jamPendingDevices` para la UI.
- `DeviceDetailPanel` ahora desactiva `KILL NET` durante estado pendiente y muestra estado de transicion (`JAMMING...` / `DISCONNECTING`).
- Propagacion de `jamPendingDevices` en layout principal y modo detached:
  - `src/App.tsx`
  - `src/ui/components/layout/MainDockedLayout.tsx`
  - `src/ui/components/layout/DetachedPanelView.tsx`
- Instrumentacion de debug en `useJamming`:
  - trazas `uiLogger.info/warn/error` en cada transicion (`toggle`, `pending`, `invoke start/stop`, `ok/error`),
  - validacion explicita de MAC antes de invocar backend,
  - payload de `start_jamming` enviado con `gatewayIp` y fallback `gateway_ip`.

### 🦀 Backend (telemetria en terminal)
- Trazas de runtime para jammer:
  - `src-tauri/src/api/commands.rs`: log de request + errores de validacion en `start_jamming/stop_jamming`.
  - `src-tauri/src/api/commands/system.rs`: log de dispatch/accepted al delegar en `JammerService`.
- Eliminado lock global de `JammerState`:
  - `JammerState` pasa de `Mutex<JammerService>` a `Arc<JammerService>`,
  - `start_jamming/stop_jamming` dejan de esperar un mutex externo y delegan directo en el servicio.
- `JammerService` endurecido contra contencion:
  - `start_attack_loop` usa `try_lock` (sin bloqueo),
  - `start_jamming/stop_jamming` vuelven a `lock` bloqueante corto para no perder ordenes reales del operador (fix regresion funcional).
  - cache interna de interfaz en runtime (refresh cada `15s`) para evitar recalculo continuo de identidad/interfaz.
  - cadencia de loop ajustada (`350ms`) para reducir presion sobre runtime sin perder efectividad.
  - eliminado log de contencion por iteracion para evitar ruido y sobrecarga en consola.
  - refactor a modo actor (`mpsc`):
    - `start_jamming/stop_jamming` solo encolan comando (retorno inmediato, sin `Mutex` compartido),
    - el hilo de ataque es el unico owner de `active_targets`,
    - eliminada via principal de bloqueo por contencion de mapa en comandos Tauri.

### 🧪 Testing
- Test unitario de `useJamming` ya valida:
  - bloqueo de gateway,
  - no reentrada durante operacion pendiente.
- Nuevo E2E de jammer:
  - `e2e/app.spec.ts`
  - caso: start/stop de `Kill Net` en panel `device` detached con target no-gateway (`192.168.1.99`) y verificacion de no congelacion de vista.
- Ajustados mocks de tests de `App` para incluir `jamPendingDevices`:
  - `src/__tests__/App.panels.test.tsx`
  - `src/__tests__/App.integration.test.tsx`

### ✅ Verificacion
- `npm test -- --run` en verde (`81` tests).
- `npm run build` en verde.
- `cargo check` en verde.
- `npx playwright test e2e/app.spec.ts -g "Kill Net"` en verde.
- `npm run test:e2e`: persisten 3 fallos previos/flaky en asserts de `NODES: 3` (no relacionados con el flujo de jammer).

## [v0.8.21] - Refactor de App.tsx: orquestador fino + hooks/modulos por responsabilidad (2026-02-11)
### ♻️ Frontend (SOLID / separacion de responsabilidades)
- `src/App.tsx` se simplifica como orquestador de alto nivel (estado global + composicion), eliminando la logica monolitica de layout/docking/detached.
- Nueva separacion por responsabilidades:
  - `src/ui/components/layout/MainDockedLayout.tsx` (composicion de UI acoplada),
  - `src/ui/components/layout/DetachedPanelView.tsx` (modo ventana detached),
  - `src/ui/hooks/modules/ui/useAppLayoutState.ts` (resizers/layout),
  - `src/ui/hooks/modules/ui/usePanelDockingState.ts` (docking/undocking/reconciliacion),
  - `src/ui/hooks/modules/ui/useDetachedRuntime.ts` (loader + ciclo de vida detached),
  - `src/ui/hooks/modules/ui/useExternalDetachedSync.ts` (sync contexto External entre ventanas).
- `NetworkScene` mantiene control de desacople como prop explicita (`onUndockScene`) sin acoplar logica de ventana en el componente 3D.

### 🧪 Tests
- Nuevos tests unitarios para hooks extraidos:
  - `src/ui/hooks/modules/__tests__/useAppLayoutState.test.ts`
  - `src/ui/hooks/modules/__tests__/usePanelDockingState.test.ts`
  - `src/ui/hooks/modules/__tests__/useDetachedRuntime.test.ts`
  - `src/ui/hooks/modules/__tests__/useExternalDetachedSync.test.ts`

## [v0.8.20] - Sincronizacion documental de multiwindow/desacople (2026-02-11)
### 📚 Documentacion
- `docs/ARCHITECTURE.md` actualizado con seccion de multiwindow:
  - flujo de desacople/reacople,
  - eventos internos (`dock-panel`, `external-context`),
  - reglas de layout cuando `scene3d`, `console` o `device` estan desacoplados.
- `docs/ATTACK_LAB.md` actualizado con seccion de `Attack Lab` desacoplado:
  - cierre por `X` nativo,
  - sincronizacion de target/escenario en caliente.
- `README.md` actualizado con resumen operativo de paneles desacoplados en desktop.

## [v0.8.19] - Ajuste UX Scene undock + ocupacion total Radar/External con Scene desacoplada (2026-02-11)
### 🎛️ Frontend (layout/controles)
- El control de desacople de `NetworkScene` se mueve dentro del propio componente 3D y queda alineado en la misma fila del icono de ojo (`TOGGLE_NODE_LABELS`), evitando solape vertical.
- Eliminado el placeholder textual de scene desacoplada en la zona central.
- Cuando `scene3d` esta desacoplada:
  - `Radar/External` ocupan el ancho completo disponible de la zona superior,
  - se oculta el splitter `Radar <-> Scene` porque no hay scene acoplada.

## [v0.8.18] - Loader de arranque en ventanas detached + retiro de controles custom de cierre/dock (2026-02-11)
### ⚡ UX / rendimiento percibido
- Añadido arranque diferido en modo `detached` con pantalla de carga breve antes de montar paneles pesados.
- Objetivo: reducir congelacion inicial al abrir y empezar a mover la ventana secundaria.

### 🧭 Comportamiento de cierre
- Eliminados botones custom de `dock/close` en la cabecera de ventana desacoplada.
- Se deja como flujo oficial el cierre por boton nativo `X` del sistema, que reacopla el panel en la ventana principal via `pagehide`.
- Desactivado `onClose` interno en paneles desacoplados (`Radar` / `External`) para evitar rutas de cierre duplicadas.

## [v0.8.17] - Cierre robusto de ventanas desacopladas + reconciliacion de estado + menos freeze inicial (2026-02-11)
### 🎛️ Frontend (UX de desacople)
- En modo ventana desacoplada, boton de dock y boton `x` tienen el mismo comportamiento:
  - reacoplan el panel en la ventana principal y cierran la secundaria.
- Añadido `pagehide` en ventanas desacopladas para emitir reacople incluso si el usuario cierra desde controles nativos del sistema.
- El listener de reacople en la principal ahora tambien fuerza cierre de la ventana desacoplada para evitar secundarias huerfanas.

### 🧠 Reconciliacion de estado multiwindow
- Añadido sondeo ligero de estado para paneles en modo Tauri:
  - si una ventana secundaria ya no existe, el estado `detached` se limpia automaticamente en la principal.
- Nuevo helper en adapter:
  - `isDetachedPanelWindowOpen(panel)` en `src/adapters/windowingAdapter.ts`.

### ⚡ Rendimiento (arranque de ventanas detached)
- `useScanner` admite `enableHydration` para evitar hidratacion de snapshot/historial cuando no aporta valor.
- `useNetworkManager` expone `enableScannerHydration`.
- En ventanas desacopladas, se desactiva hidratacion de scanner para paneles no dependientes de inventario (`radar`, `external`, `console`), reduciendo trabajo al abrir y mejorando fluidez al arrastrar.

### 🧪 Tests
- Extendido `src/adapters/__tests__/windowingAdapter.test.ts` con cobertura de `isDetachedPanelWindowOpen`.

## [v0.8.16] - Sincronizacion External desacoplado + layout elastico + bootstrap ligero en ventanas detached (2026-02-11)
### 🎛️ Frontend (multiwindow UX)
- `ExternalAudit` desacoplado ya recibe contexto en caliente desde la ventana principal:
  - nuevo canal de evento `netsentinel://external-context`,
  - envio de `targetDevice`, `scenarioId` y `autoRun` al pulsar `LAB AUDIT` con External en ventana nativa.
- `ExternalAuditPanel` re-dispara `autoRun` cuando cambia objetivo/escenario para evitar quedar bloqueado en el primer montaje.

### 🧱 Layout responsivo real al desacoplar
- Si `CONSOLE` esta desacoplado, se ocultan su bloque y resizer para liberar altura al resto de paneles.
- Si `DEVICE` esta desacoplado, se ocultan sidebar y resizer para liberar anchura al canvas principal.

### ⚡ Rendimiento de arranque en ventanas desacopladas
- `useNetworkManager` ahora permite desactivar bootstrap automatico.
- Ventanas en modo `detached` desactivan auto-scan/autosync de gateway para reducir carga inicial y evitar congelaciones al abrir.

### 🧪 Tests
- Extendidos tests de `windowingAdapter`:
  - emision/escucha fallback del contexto `external-context`.

## [v0.8.15] - Fix runtime de ventanas nativas + cobertura de adapter windowing (2026-02-11)
### 🧩 Frontend (windowing robusto)
- `src/adapters/windowingAdapter.ts` deja de depender solo de `__TAURI_INTERNALS__` para decidir runtime.
- El flujo de desacople ahora intenta primero la API nativa de Tauri y hace fallback solo si falla realmente:
  - apertura/cierre de ventanas desacopladas,
  - emision/escucha de evento de reacople,
  - cierre de ventana actual.
- Se mantiene el fallback web/test por `CustomEvent`, pero sin bloquear el camino nativo en desktop.

### 🧪 Tests
- Nuevo test unitario de regresion:
  - `src/adapters/__tests__/windowingAdapter.test.ts`
- Cubre parseo de contexto detached, apertura nativa, fallback de eventos y fallback de cierre.

## [v0.8.14] - Multiwindow nativo Tauri para paneles desacoplados (2026-02-11)
### 🎛️ Frontend (arquitectura/windowing)
- Nuevo adapter de ventanas desacopladas:
  - `src/adapters/windowingAdapter.ts`
  - responsabilidades:
    - abrir/cerrar ventanas nativas (`WebviewWindow`) por panel,
    - parsear contexto `detached` por querystring,
    - sincronizar reacople con eventos (`netsentinel://dock-panel`),
    - fallback web/test via `CustomEvent`.
- `App.tsx` actualizado para:
  - usar `windowingAdapter` en undock/dock,
  - soportar modo `detached` por URL (`?detached=1&panel=...`),
  - renderizar panel standalone en ventana secundaria con accion de retorno al main.
- En entorno desktop Tauri, los paneles desacoplados salen fuera de la ventana principal como ventanas reales.
- Se mantiene fallback `DetachedWindowPortal` para web/tests o cuando no hay runtime Tauri.

### 🧪 Tests
- Ajustados tests de docking por asincronia de apertura de ventana:
  - `src/__tests__/App.panels.test.tsx`
- Se mantiene cobertura de fallback y drag:
  - `src/ui/components/layout/__tests__/DetachedWindowPortal.test.tsx`

### ✅ Verificacion
- `npm test -- --run` en verde (`26 files / 64 tests`).
- `npm run build` en verde.
- `cargo check` en verde.

## [v0.8.13] - Ventanas desacopladas movibles + tamano inicial reducido (2026-02-11)
### 🎛️ Frontend (usabilidad)
- `DetachedWindowPortal` mejora la experiencia de desacople:
  - reduce el tamano inicial de apertura (clamp por pantalla) para evitar ventanas demasiado grandes,
  - elimina `popup=yes` y fuerza `resizable=yes` para mejor control del usuario.
- En modo fallback (cuando `window.open` falla), el panel desacoplado ahora:
  - se muestra en overlay interno,
  - es **movible por drag** con cabecera,
  - mantiene boton de cierre/dock en cabecera.
- Ajustados tamanos de apertura por modulo:
  - `Console`, `Device`, `Radar`, `External`.

### 🧪 Tests
- Extendidos tests de `DetachedWindowPortal` para validar drag real del fallback:
  - `src/ui/components/layout/__tests__/DetachedWindowPortal.test.tsx`

### ✅ Verificacion
- `npm test -- --run` en verde (`26 files / 64 tests`).
- `npm run build` en verde.
- `cargo check` en verde.

## [v0.8.12] - Fixes de desacople UI + split independiente Radar/External (2026-02-11)
### 🎛️ Frontend (UX funcional)
- Corregido desacople de paneles cuando el entorno bloquea `window.open`:
  - `DetachedWindowPortal` ahora tiene fallback en overlay interno y no pierde la accion del usuario.
- `Radar` y `External Audit` ahora tienen resize independiente cuando conviven en el carril lateral:
  - nuevo splitter interno arrastrable (`RESIZE_DOCK_SPLIT`) para repartir ancho entre ambos.
- Reubicados iconos de desacople para no tapar controles:
  - `Console` y `Device` usan cabecera dedicada (`InlinePanelHeader`) en vez de boton flotante sobre contenido.
  - ventanas desacopladas usan barra superior propia (`DetachedShell`) con boton de retorno.

### 🧪 Tests
- Nuevo test de fallback de portal:
  - `src/ui/components/layout/__tests__/DetachedWindowPortal.test.tsx`
- Nuevos tests de docking/undocking y split:
  - `src/__tests__/App.panels.test.tsx`

### ✅ Verificacion
- `npm test -- --run` en verde (`26 files / 63 tests`).
- `npm run build` en verde.
- `cargo check` en verde.

## [v0.8.11] - UI modular desacoplable + External Audit dockeado junto a Radar (2026-02-11)
### 🎛️ Frontend (layout/UX)
- `ExternalAuditPanel` deja de abrirse como overlay flotante y pasa a carril lateral compartido con `Radar`.
- Nuevo comportamiento de autoajuste:
  - si solo hay uno abierto (`Radar` o `External`), ocupa el carril lateral,
  - si ambos estan abiertos, se muestran en paralelo con reparto automatico de espacio.
- Soporte de panel desacoplable (ventana independiente) para:
  - `ConsoleLogs`
  - `DeviceDetailPanel`
  - `RadarPanel`
  - `ExternalAuditPanel`

### 🧱 Infraestructura UI
- Nuevo portal reutilizable:
  - `src/ui/components/layout/DetachedWindowPortal.tsx`
- `src/App.tsx` refactorizado para gestionar estado dock/undock por modulo y render en ventana externa.
- `src/ui/components/panels/external_audit/ExternalAuditPanel.tsx` extiende props con `embedded` para render flexible embebido o desacoplado.

### ✅ Verificacion
- `npm test -- --run` en verde.
- `npm run build` en verde.
- `cargo check` en verde.

## [v0.8.10] - Aclaracion operativa de Attack Lab (antes: External Audit) + guia de migracion a Native Audit (2026-02-11)
### 📚 Documentacion
- `docs/ATTACK_LAB.md` ampliado con:
  - interpretacion detallada de un caso real `exit=1` en escenario `HTTP HEAD`,
  - significado de `AUTO`, `STDOUT/STDERR`, `ok=false` y `auditId`,
  - definicion operativa de `router` como `gateway` detectado.
- Añadida guia de refactor:
  - `docs/ATTACK_LAB_REFACTOR.md`
  - plan por fases para migrar de wrapper CLI (`ExternalAudit`) a motor nativo Rust (`NativeAudit`) sin simulaciones en LAB principal.

## [v0.8.9] - Enlace operativo AGENTS <-> DOC-ATTACK <-> Attack Lab (antes: External Audit) (2026-02-11)
### 📚 Documentacion
- `AGENTS.md` actualizado para declarar `DOC-ATTACK.md` como catalogo tactico obligatorio y `docs/ATTACK_LAB.md` como runtime oficial.
- Añadidas reglas de integracion para plantillas:
  - traduccion a escenarios en `src/core/logic/externalAuditScenarios.ts`,
  - ejecucion via `start_external_audit` / `cancel_external_audit` o `simulate`.
- Documentado en `AGENTS.md` el flujo obligatorio "seleccion en Radar -> LAB AUDIT -> ExternalAuditPanel -> eventos".
- `docs/ATTACK_LAB.md` ampliado con:
  - seccion de vinculacion con `DOC-ATTACK.md`,
  - flujo real actual de auto-ejecucion por target (gateway/device),
  - puntos exactos de codigo para extender plantillas por router.

## [v0.8.8] - Cierre de refactor: docs alineadas y barrido de deuda residual (2026-02-11)
### 📚 Documentacion
- Actualizadas rutas de hooks en:
  - `docs/ARCHITECTURE.md`
  - `docs/ATTACK_LAB.md`
  - `docs/TESTING.md`
  - `docs/RADAR_VIEW.md`
  - `docs/REFACTOR_AUDIT.md`
- `AGENTS.md` actualizado con la estructura oficial de hooks por dominio en `src/ui/hooks/modules/*`.

### ♻️ Deuda tecnica
- Eliminado `console.log` de `src/core/logic/intruderDetection.ts`.
- `useNetworkNodeState` migra trazas de debug a `uiLogger` para mantener politica unificada de logging UI.

## [v0.8.7] - Migracion fisica de hooks por dominio (2026-02-11)
### ♻️ Frontend (estructura)
- Reorganizados hooks de `src/ui/hooks/modules` en subcarpetas:
  - `network/`
  - `radar/`
  - `traffic/`
  - `ui/`
  - `scene3d/`
  - `shared/`
- Actualizados imports en componentes, hooks y tests para nuevas rutas.

### ✅ Verificacion
- `npm test -- --run` en verde.
- `npm run build` en verde.

## [v0.8.6] - Refactor scanner/router con utilidades compartidas (2026-02-11)
### ♻️ Frontend (hooks)
- Extraidas reglas de fusion y validacion de intel de dispositivos a:
  - `src/ui/hooks/modules/shared/deviceMerge.ts`
- `useScanner` ahora usa `mergeScanInventory` para mantener inventario estable sin duplicar logica.
- `useRouterHacker` ahora usa `mergeRouterInventory` para fusion de nodos importados desde gateway.

### 🧪 Testing
- Nuevo test unitario:
  - `src/ui/hooks/modules/__tests__/deviceMerge.test.ts`
- Mantiene cobertura de regresion de `useScanner` y `useRouterHaker`.

## [v0.8.5] - Hardening documental + limpieza UI + troceo bootstrap manager (2026-02-11)
### 📚 Documentacion
- `PRODUCT.md` reescrito para reflejar el estado real de Tauri/Rust:
  - comandos actuales,
  - Radar View,
  - snapshot/keyring,
  - External Audit.
- `docs/SECURITY.md` actualizado con reglas de observabilidad segura en frontend.
- `CONTRIBUTING.md` actualizado con reglas de rendimiento frontend (lazy/chunks) y politica de logs de debug.

### ♻️ Frontend (deuda tecnica)
- Nuevo logger unificado: `src/ui/utils/logger.ts`.
- Eliminados `any` en `HistoryPanel` y tipado con `ScanSession`/`DeviceDTO`.
- Reemplazo de `console.error/warn` dispersos por `uiLogger` en hooks de scanner, trafico y jamming.

### 🧩 Frontend (arquitectura)
- Nuevo hook `src/ui/hooks/modules/useBootstrapNetwork.ts` para aislar:
  - carga de identidad,
  - auto-scan de arranque,
  - auto-sync de dispositivos desde gateway.
- `useNetworkManager` queda mas delgado y orientado a composicion.

## [v0.8.4] - Integracion 3D->HUD + lazy loading + debug 3D controlado (2026-02-11)
### ✅ Integracion UI
- Nuevo test `src/__tests__/App.integration.test.tsx` para validar flujo:
  - seleccion en `NetworkScene` -> sincronizacion en `DeviceDetailPanel` y `ConsoleLogs`.

### ⚡ Performance (bundle inicial)
- `App.tsx` actualizado con `React.lazy` + `Suspense` para cargar bajo demanda:
  - `NetworkScene`
  - `RadarPanel`
  - `ExternalAuditPanel`
  - `DeviceDetailPanel`

### 🧪 Debug 3D
- `useNetworkNodeState` ya no escribe logs de hover/click por defecto.
- Activacion de logs solo en desarrollo y con flag:
  - `localStorage.setItem("netsentinel.debug3d", "true")`

### 📚 Documentacion
- `docs/ARCHITECTURE.md`: añadido diagrama rapido del flujo 3D -> manager -> HUD.
- `README.md`: añadida seccion de testing por capas (unit/integracion frontend).

## [v0.8.3] - Refactor capa 3D + cobertura de hooks (2026-02-11)
### ♻️ Frontend 3D (Scene)
- Extraida logica de escena a `src/ui/hooks/modules/useNetworkSceneState.ts`:
  - persistencia de `showLabels`,
  - enriquecimiento de dispositivos,
  - deteccion de nodo central (gateway),
  - calculo de color por nodo.
- Extraida logica de nodo a `src/ui/hooks/modules/useNetworkNodeState.ts`:
  - hover/cursor/click,
  - estado visual (escala y emisivo).
- Extraida logica de label a `src/ui/hooks/modules/useNodeLabelState.ts`:
  - paleta por tipo de dispositivo,
  - normalizacion de confianza (LOW/MED/HIGH).
- `NetworkScene`, `NetworkNode` y `NodeLabel` quedan mas orientados a presentacion.

### 🎨 Tokens / estilo
- Nuevo modulo `src/ui/components/3d/sceneTokens.ts` conectado con `hudTokens` para unificar colores/tipografia en la capa 3D.

### ✅ Testing
- Nuevos tests:
  - `src/ui/hooks/modules/__tests__/useNetworkSceneState.test.ts`
  - `src/ui/hooks/modules/__tests__/useNetworkNodeState.test.ts`
  - `src/ui/hooks/modules/__tests__/useNodeLabelState.test.ts`

### 📚 Documentacion
- `README.md`: añadido resumen del patron frontend modular.
- `docs/ARCHITECTURE.md`: documentada estructura frontend por feature y capa 3D.
- `AGENTS.md`: regla explicita para aplicar patron modular tambien en componentes 3D.

## [v0.8.2] - Cierre documental del refactor frontend (2026-02-11)
### 📚 Documentacion
- `docs/ARCHITECTURE.md` actualizado con el patron frontend modular:
  - panel contenedor + hook `useXxxPanelState` + sub-vistas puras + tokens visuales.
- Añadidos ejemplos reales aplicados (Radar, ConsoleLogs, Traffic y DeviceDetail).
- `AGENTS.md` actualizado con reglas operativas para evitar componentes monoliticos y exigir test unitario por hook de panel.

## [v0.8.1] - Cobertura de hooks refactorizados (2026-02-11)
### ✅ Testing (frontend)
- Nuevos tests unitarios para hooks extraidos:
  - `src/ui/hooks/modules/__tests__/useConsoleLogsState.test.ts`
  - `src/ui/hooks/modules/__tests__/useTrafficPanelState.test.ts`
  - `src/ui/hooks/modules/__tests__/useDeviceDetailPanelState.test.ts`
- Cobertura añadida en:
  - cambios de pestaña y limpieza contextual en `ConsoleLogs`,
  - filtros/paginacion/resolucion de nombres en `Traffic`,
  - derivadas y handlers de acciones en `DeviceDetail`.

### ✅ Validaciones
- `npm test -- --run` (20 files / 54 tests en verde)
- `npm run build` (ok)

## [v0.8.0] - Tokens visuales HUD compartidos (2026-02-11)
### 🎨 Frontend (estilos)
- Añadido `src/ui/styles/hudTokens.ts` como fuente compartida de:
  - tipografia mono (`HUD_TYPO.mono`)
  - paleta base HUD (`HUD_COLORS`)
- Integracion inicial de tokens en modulos refactorizados:
  - `ConsoleLogs` (`src/ui/components/panels/ConsoleLogs.tsx`, `src/ui/components/panels/console_logs/consoleLogsStyles.ts`)
  - `Traffic` (`src/ui/components/panels/traffic/TrafficStyles.ts`, `src/ui/components/panels/traffic/TrafficFilterBar.tsx`, `src/ui/components/panels/traffic/TrafficTable.tsx`)
  - `Radar` (`src/ui/components/hud/RadarPanel.tsx`, `src/ui/components/hud/radar/radarUtils.ts`)
  - `DeviceDetail` (tipografia/colores clave en `src/ui/features/device_detail/components/DeviceDetailPanel.tsx`)
- Objetivo: reducir hardcodes, mejorar consistencia visual y facilitar cambios de tema sin deuda tecnica.

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)
