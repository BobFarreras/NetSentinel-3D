# Diario de desarrollo (CHANGELOG)

Todos los cambios notables en NetSentinel deben documentarse aqui.
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

## [v0.8.10] - Aclaracion operativa de External Audit + guia de migracion a Native Audit (2026-02-11)
### 📚 Documentacion
- `docs/ATTACK_LAB.md` ampliado con:
  - interpretacion detallada de un caso real `exit=1` en escenario `HTTP HEAD`,
  - significado de `AUTO`, `STDOUT/STDERR`, `ok=false` y `auditId`,
  - definicion operativa de `router` como `gateway` detectado.
- Añadida guia de refactor:
  - `docs/ATTACK_LAB_REFACTOR.md`
  - plan por fases para migrar de wrapper CLI (`ExternalAudit`) a motor nativo Rust (`NativeAudit`) sin simulaciones en LAB principal.

## [v0.8.9] - Enlace operativo AGENTS <-> DOC-ATTACK <-> External Audit (2026-02-11)
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
  - `DeviceDetail` (tipografia/colores clave en `src/ui/components/hud/DeviceDetailPanel.tsx`)
- Objetivo: reducir hardcodes, mejorar consistencia visual y facilitar cambios de tema sin deuda tecnica.

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.7.9] - Refactor DeviceDetailPanel: acciones y derivadas en hook (2026-02-11)
### ♻️ Frontend (Device Detail)
- Extraida logica de derivadas/acciones de `DeviceDetailPanel` a `src/ui/hooks/modules/useDeviceDetailPanelState.ts`.
- El panel mantiene su UI y contratos actuales, pero delega:
  - nombre resuelto (`name/hostname/Unknown`),
  - MAC normalizada,
  - visibilidad de bloque WiFi,
  - color de señal,
  - handlers de `LAB AUDIT` y `AUDIT GATEWAY SECURITY`.
- Objetivo: reducir responsabilidad del componente y facilitar pruebas/escalado.

### ✅ Validaciones
- `npm test -- --run src/ui/components/hud/__tests__/DeviceDetailPanel.test.tsx` (ok)
- `npm run build` (ok)

## [v0.7.8] - Refactor TrafficPanel: estado y vistas separadas (2026-02-11)
### ♻️ Frontend (Traffic)
- Extraida la logica de filtros, paginacion incremental y resolucion de nombres a `src/ui/hooks/modules/useTrafficPanelState.ts`.
- `src/ui/components/panels/TrafficPanel.tsx` queda como ensamblador de UI.
- Troceo de UI en componentes:
  - `src/ui/components/panels/traffic/TrafficFilterBar.tsx`
  - `src/ui/components/panels/traffic/TrafficTable.tsx`
  - `src/ui/components/panels/traffic/TrafficStyles.ts`
- Se mantiene comportamiento funcional: filtros `ALL/JAMMED/TARGET`, selector automatico de `TARGET`, scroll incremental y accion `CLR`.

### ✅ Validaciones
- `npm test -- --run src/ui/components/panels/__tests__/TrafficPanel.test.tsx` (ok)
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.7.7] - Refactor ConsoleLogs: separacion por vistas y estado (2026-02-11)
### ♻️ Frontend (ConsoleLogs)
- Extraida la logica de estado/acciones a `src/ui/hooks/modules/useConsoleLogsState.ts`.
- `src/ui/components/panels/ConsoleLogs.tsx` pasa a ser un contenedor de composicion.
- Nuevo troceo por responsabilidad:
  - `src/ui/components/panels/console_logs/ConsoleLogsHeader.tsx`
  - `src/ui/components/panels/console_logs/SystemLogsView.tsx`
  - `src/ui/components/panels/console_logs/RadarLogsView.tsx`
  - `src/ui/components/panels/console_logs/consoleLogsStyles.ts`
- Se mantiene el comportamiento actual de pestañas, limpieza contextual y seleccion de nodo desde `RADAR LOGS`.

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.7.6] - Refactor RadarPanel: separacion UI/logica (2026-02-11)
### ♻️ Frontend (HUD Radar)
- Extraida la logica de estado/efectos/memos a `src/ui/hooks/modules/useRadarPanelState.ts`.
- `src/ui/components/hud/RadarPanel.tsx` queda como contenedor de composicion (sin logica de negocio de radar).
- Troceado de UI en subcomponentes dedicados:
  - `src/ui/components/hud/radar/RadarHeader.tsx`
  - `src/ui/components/hud/radar/RadarScope.tsx`
  - `src/ui/components/hud/radar/RadarIntelPanel.tsx`
  - `src/ui/components/hud/radar/RadarLegalModal.tsx`
  - utilidades/tipos en `src/ui/components/hud/radar/radarUtils.ts` y `src/ui/components/hud/radar/radarTypes.ts`

### ✅ Validaciones
- `npm test -- --run` (ok)
- `npm run build` (ok)

## [v0.7.3] - Inventario estable + mejoras de labels 3D + logs (2026-02-10)
### 🧠 Scanner (UX / estabilidad)
- `Scan Net` ya no reduce el inventario si el escaneo devuelve menos dispositivos temporalmente (merge por union).
- Evitado el conflicto de hidratacion (snapshot/historial) que podia sobrescribir el inventario durante el auto-scan.
- Añadido test de regresion para asegurar que el inventario no se recorta cuando el scan ve menos nodos.

### 🧩 UI (Labels 3D)
- Tarjetas (labels) mas grandes y legibles con estetica terminal/cyberpunk.
- El router/gateway usa una tarjeta especial con filas (IP/MAC/Vendor/iface/GW).
- Toggle para ocultar/mostrar tarjetas persistido en `localStorage`.

### 🧾 Logs (trazabilidad)
- `SYSTEM LOGS` pinta eventos `CRITICAL`/`💀` en rojo.
- `audit_router/fetch_router_devices`: logging de dispositivos conectado tras enriquecimiento ARP para evitar `MAC=00:00:...` en consola cuando ya existe MAC real.

## [v0.7.4] - Documentacion External Audit / LAB Audit (2026-02-10)
### 📚 Documentacion
- Añadido `docs/ATTACK_LAB.md`:
  - arquitectura end-to-end (UI -> Tauri -> proceso -> eventos),
  - mapa de archivos,
  - DTOs y eventos,
  - limitaciones,
  - guia paso a paso para añadir escenarios LAB (simulados o externos).
### 🧭 Onboarding
- `README.md`: enlace directo a `docs/ATTACK_LAB.md`.

## [v0.7.5] - Refactor backend (SOLID) + hardening runtime + fixtures (2026-02-10)
### 🦀 API (Tauri)
- `src-tauri/src/api/commands.rs`: comandos agrupados por dominio con submodulos `api/commands/*`.
- `src-tauri/src/lib.rs`: wiring mas limpio (solo dependencias + registro de comandos).

### 🦀 External Audit (wrapper CLI)
- `src-tauri/src/application/external_audit/*`: runner/validacion/sink testeable.
- Streaming real de `stdout/stderr`, cancelacion y timeout con tests.

### 🦀 WiFi / Vendor
- Resolver OUI data-driven con seed embebido y override en AppData (`oui.json`).
- `WifiService` como caso de uso fino + normalizacion pura (`wifi_normalizer`).

### 🦀 Runtime (identidad/traffic/jammer)
- Identidad local robusta con parser puro + fixtures (`local_intelligence/*`).
- Preflight del sniffer: si no se abre el canal, no se marca el monitor como running.
- Hardening de `JammerService` y `PacketInjector` (menos `unwrap()`, mas checks, tests).

### 📚 Docs
- Sincronizada documentacion con arquitectura real (README, External Audit, Architecture, etc.).

## [v0.6.3] - Plan Radar View y prioridades 2026 (2026-02-10)
### 📚 Documentacion estrategica
- Creado `docs/RADAR_VIEW.md` con guia paso a paso para implementar `Radar View (WiFi Spectrum)`:
  - arquitectura backend/frontend,
  - fases de entrega,
  - criterios de aceptacion,
  - reglas de seguridad.

### 🧭 Priorizacion de producto
- Actualizadas `Prioridades actuales` en `AGENTS.md` con foco en:
  - `scan_airwaves` y vista Radar,
  - simulaciones educativas controladas de PMKID/IoT/MLO (modo inferencia),
  - hardening legal/sanitizacion/trazabilidad,
  - cobertura de testing.

### 🔐 Seguridad y alcance
- Actualizado `docs/SECURITY.md` para dejar explicito:
  - uso autorizado en laboratorio,
  - simulaciones didacticas permitidas,
  - exclusion de automatizaciones ofensivas reales.

### 🏗️ Arquitectura y testing
- Actualizado `docs/ARCHITECTURE.md` con roadmap de `scan_airwaves`.
- Actualizado `docs/TESTING.md` con prioridades de pruebas para Radar View.
- Actualizado `README.md` con seccion de roadmap inmediato y enlace a `docs/RADAR_VIEW.md`.

## [v0.6.4] - Backend inicial Radar View: scan_airwaves (2026-02-10)
### 🦀 Backend (Rust + Tauri)
- Añadido servicio `WifiService` con normalizacion defensiva:
  - saneo de SSID (control chars, longitud, `<hidden>`),
  - clasificacion de riesgo (`HARDENED|STANDARD|LEGACY|OPEN`),
  - calculo `distance_mock` para visualizacion.
- Añadido puerto `WifiScannerPort` y scanner de sistema con `wifiscanner`.
- Añadido comando Tauri `scan_airwaves` y DTO `WifiNetworkDTO`.

### ✅ Verificacion
- `cargo check --tests` en verde.

## [v0.6.5] - Gobernanza GitHub: PR review obligatorio (2026-02-10)
### 🧭 Proceso
- Añadido `CONTRIBUTING.md` con politica de PR y revision senior.
- Añadidos ficheros de soporte GitHub:
  - `.github/CODEOWNERS`
  - `.github/pull_request_template.md`
- Actualizado `AGENTS.md` para prohibir commits finales automaticos por agentes IA sin confirmacion.

### 🛠️ Calidad
- Ajuste de tipos explicitos en `src-tauri/src/infrastructure/wifi/wifi_scanner.rs` para evitar errores de inferencia en IDE.

## [v0.6.6] - Radar View UI inicial (CRT terminal) + soporte E2E (2026-02-10)
### 🎛️ Frontend
- Añadido panel `RadarPanel` con estetica CRT/cyberpunk y aviso legal de primer uso:
  - `src/ui/components/hud/RadarPanel.tsx`
- Integrado el toggle `RADAR` en:
  - `src/ui/components/layout/TopBar.tsx`
  - `src/App.tsx`

### 🧪 E2E
- Extendida la bridge mock con `scan_airwaves`:
  - `src/shared/tauri/bridge.ts`
- Añadido test E2E de Radar View:
  - `e2e/app.spec.ts`

## [v0.6.7] - Radar View UI v2: filtros y auto-refresh (2026-02-10)
### 🎛️ Frontend
- `src/ui/components/hud/RadarPanel.tsx`:
  - filtros por riesgo, banda, canal y busqueda (SSID/vendor/BSSID),
  - contador `VISIBLE` para ver impacto de filtros,
  - auto-refresh opcional (sin solapar escaneos),
  - `aria-label` para tests estables.

### 🧪 Tests
- Añadido `src/ui/components/hud/__tests__/RadarPanel.test.tsx`.

## [v0.6.8] - Radar View: escaneo Windows mas fiable + layout dock a la izquierda (2026-02-10)
### 🦀 Backend (Windows)
- `src-tauri/src/infrastructure/wifi/wifi_scanner.rs`:
  - preferencia por `netsh wlan show networks mode=bssid` como fuente de verdad en Windows.
  - parser tolerante a locales (claves como `Señal/Senal/Signal`, `Canal/Channel`, `Autenticacion/Auth`).
  - fallback cuando Windows omite BSSID/canal/señal: se genera un pseudo-BSSID estable para no devolver lista vacia.
  - enriquecimiento con `netsh wlan show interfaces` para obtener RSSI/canal/AP BSSID reales de la red conectada.

### 🎛️ Frontend (Layout)
- `src/App.tsx`:
  - Radar View acoplado a la izquierda (resizable por anchura) sin invadir el espacio vertical de `ConsoleLogs`.

### 📚 Documentacion
- `docs/RADAR_VIEW.md`:
  - seccion de troubleshooting en Windows (cache de escaneo, permisos, limitaciones de driver).
  - glosario/guia de `NODE INTEL` (CH, bandas, riesgo, auto, busqueda).

## [v0.6.9] - Radar View: RADAR LOGS + AP conectado resaltado + ayuda in-app (2026-02-10)
### 🎛️ Frontend
- `src/ui/components/panels/ConsoleLogs.tsx`:
  - nueva pestaña `RADAR LOGS` para trazabilidad local de escaneos WiFi.
- `src/ui/hooks/modules/useWifiRadar.ts`:
  - registra resumen y detalle de cada escaneo en `RADAR LOGS` (SSID/BSSID/vendor/seguridad/canal/RSSI/riesgo).
- `src/ui/components/hud/RadarPanel.tsx`:
  - el AP conectado se resalta con anillo cian y etiqueta `CONNECTED (TU ROUTER)`.
  - boton `?` para explicar `NODE INTEL` (riesgo/banda/canal/busqueda/auto) directamente en la UI.

### 🦀 Backend (Contratos)
- `src-tauri/src/domain/entities.rs`, `src-tauri/src/api/dtos.rs`:
  - añadido `isConnected` en WiFi Radar para identificar el AP conectado cuando el SO lo expone.
- `src-tauri/src/infrastructure/wifi/wifi_scanner.rs`:
  - marca `is_connected` a partir de `netsh wlan show interfaces` en Windows.

### 🧪 Tests
- Añadidos tests:
  - `src/ui/hooks/modules/__tests__/useRadarLogs.test.ts`
  - `src/ui/components/panels/__tests__/ConsoleLogs.test.tsx`

## [v0.7.0] - ExternalAuditService: wrapper async de herramientas CLI (2026-02-10)
### 🦀 Backend (Rust + Tauri)
- Añadido `ExternalAuditService` como orquestador de herramientas externas ya instaladas por el administrador:
  - `src-tauri/src/application/external_audit_service.rs`
- Nuevos comandos Tauri:
  - `start_external_audit`
  - `cancel_external_audit`
- Streaming en tiempo real de logs via eventos Tauri:
  - `external-audit-log` (stdout/stderr)
  - `external-audit-exit` (exit code, success, duration)

### 🔐 Seguridad (DevSecOps)
- Ejecucion sin shell (args tokenizados) y validaciones defensivas (limites de args/env/timeout) para reducir riesgos operativos.

## [v0.7.1] - External Audit UI: LAB por dispositivo + escenarios (2026-02-10)
### 🎛️ Frontend
- Añadido panel `ExternalAuditPanel` con dos modos:
  - `LAB`: escenarios preconfigurados por dispositivo (externo o simulado).
  - `CUSTOM`: ejecucion manual (binario + args).
- Añadido boton `LAB AUDIT` en `DeviceDetailPanel` para abrir auditorias por dispositivo.
- Añadido boton `EXT AUDIT` en TopBar para abrir el panel en modo manual.

### 🧠 Logica (escenarios)
- Nuevo catalogo de escenarios en `src/core/logic/externalAuditScenarios.ts`:
  - presets no intrusivos (recon basico, fingerprint de cabeceras),
  - simulaciones didacticas (PMKID/IoT) sin ejecucion ofensiva.

## [v0.7.2] - Auto-scan + snapshot + credenciales locales (2026-02-10)
### ⚡ Arranque (UX)
- Al iniciar la app, se puede ejecutar auto-scan (preferencia `netsentinel:autoScanOnStartup` en `localStorage`).
- El escaneo usa el CIDR derivado de `get_identity` (IP + netmask), con fallback a `/24`.

### 💾 Persistencia
- Nuevo snapshot rapido en AppData: `latest_snapshot.json` (carga inmediata de inventario al abrir la app).
- Nuevos comandos:
  - `save_latest_snapshot`, `load_latest_snapshot`

### 🔐 Credenciales (local, seguro)
- Al detectar credenciales del gateway, se guardan en el keyring del sistema (Windows Credential Manager) para:
  - sincronizar `fetch_router_devices` automaticamente en el arranque (si existe credencial almacenada),
  - reducir dependencia de repetir `audit_router`.
- Nuevos comandos:
  - `save_gateway_credentials`, `get_gateway_credentials`, `delete_gateway_credentials`

### 🧠 Identificacion
- Mejorado `VendorResolver` con deteccion de MAC aleatoria (privacy) y soporte opcional de `oui.json` en AppData.
- Filtro defensivo de hostnames: se descarta `localhost` en IPs remotas para evitar falsos positivos (TV/Alexa por cable, etc.).

## [v0.6.2] - Prioridades operativas: Logs, Live Traffic y Guia funcional (2026-02-10)
### 🧭 Gobierno y prioridades
- Actualizadas prioridades en `AGENTS.md` para enfocar:
  - comentarios en castellano en archivos afectados,
  - correccion de `SYSTEM LOGS` (scroll y textos),
  - correccion de filtros de `LIVE TRAFFIC`,
  - documentacion funcional en `README.md`.

### 🖥️ UI: Console y trafico
- `src/ui/components/panels/ConsoleLogs.tsx`:
  - activado paso de `jammedPackets` a `TrafficPanel`.
  - ajuste de contenedores flex (`minHeight: 0`) para scroll fiable.
  - eliminado recorte por `ellipsis` en logs de sistema y habilitado wrapping.
- `src/ui/components/panels/TrafficPanel.tsx`:
  - etiqueta del filtro `TARGET` usando `vendor`/`hostname` antes que IP.
  - limpieza de comentarios y tipado de `FilterBtn` sin `any`.
- `src/ui/hooks/modules/useTrafficMonitor.ts`:
  - comentarios actualizados a castellano tecnico.

### 📚 Documentacion
- `README.md`:
  - nueva guia de `LIVE TRAFFIC` (colores, columnas y filtros).
  - guia paso a paso para implementar prioridades sin romper funcionalidad.

## [v0.6.1] - Reestructuracion de AGENTS.md para Agentes IA (2026-02-10)
### 📚 Documentacion de gobierno
- Reestructurado `AGENTS.md` a formato explicito de perfil de agente:
  - `Descripcion`
  - `Instrucciones`
  - `Tono`
  - `Prioridades actuales`
- Conservadas y reorganizadas las reglas tecnicas existentes:
  - arquitectura hexagonal real del repositorio,
  - comandos Tauri vigentes,
  - contratos Rust/TypeScript,
  - validaciones minimas,
  - Definition of Done y flujo operativo.
- Objetivo del cambio: facilitar onboarding de juniors y reducir ambiguedad operativa de agentes IA.

## [v0.6.0] - Hardening Continuo de CI, Validacion y Resiliencia E2E (2026-02-09)
### 🔐 Seguridad y validacion
- CSP reforzada en `src-tauri/tauri.conf.json` con directivas adicionales:
  - `script-src 'self'`
  - `object-src 'none'`
  - `base-uri 'none'`
  - `form-action 'none'`
  - `frame-ancestors 'none'`
- Validacion semantica de IPs en backend:
  - nuevo validador `validate_usable_host_ipv4` en `src-tauri/src/api/validators.rs`.
  - aplicado en comandos de auditoria y jamming para bloquear IPs no operativas (`0.0.0.0`, loopback, multicast, broadcast).

### 🧪 Testing y robustez
- Ampliados tests unitarios Rust:
  - `src-tauri/src/application/jammer_service.rs`
  - `src-tauri/src/application/traffic_service.rs`
  - ajustes de tests en `src-tauri/src/api/commands.rs`, `src-tauri/src/lib.rs` y `src-tauri/src/api/validators.rs`.
- E2E ampliado con escenarios negativos controlados:
  - fallo forzado de `scan_network`.
  - fallo forzado de `start_traffic_sniffing`.
  - implementado soporte de flags de escenario en `src/shared/tauri/bridge.ts`.

### ⚙️ CI
- Workflow `.github/workflows/ci.yml` actualizado con auditorias de dependencias no bloqueantes:
  - `npm audit --omit=dev --audit-level=high`
  - `cargo audit` (instalando `cargo-audit`)
- Actualizada dependencia `reqwest` de `0.11` a `0.12` en `src-tauri/Cargo.toml` para corregir vulnerabilidad transitiva reportada por RustSec (`RUSTSEC-2024-0421` / `idna`).

### 📚 Documentacion
- Actualizados `docs/SECURITY.md` y `docs/TESTING.md` con el nuevo estado de seguridad, CI y cobertura E2E.

## [v0.5.9] - Validacion Defensiva de Inputs en Comandos Rust (2026-02-09)
### 🔐 Hardening backend
- Añadido modulo de validadores:
  - `src-tauri/src/api/validators.rs`
- Aplicadas validaciones en comandos API:
  - `scan_network`: rango IPv4/CIDR valido.
  - `audit_target`: IPv4 valida.
  - `audit_router`: IPv4 valida.
  - `fetch_router_devices`: IPv4 valida + `user/pass` no vacios y con longitud maxima.
- Aplicadas validaciones en comandos de jamming:
  - `start_jamming`: valida `ip`, `mac`, `gateway_ip` y bloquea `ip == gateway_ip`.
  - `stop_jamming`: valida `ip`.

### 🧪 Tests añadidos
- Tests unitarios de validadores en `src-tauri/src/api/validators.rs`.
- Tests unitarios de validacion en:
  - `src-tauri/src/api/commands.rs`
  - `src-tauri/src/lib.rs`

### 📚 Documentacion
- Actualizado `docs/SECURITY.md` con el estado actual de validacion de inputs.

### ✅ Verificacion
- `cargo check --tests` en verde.
- `npm test -- --run` en verde.

## [v0.5.8] - Hardening CSP en Tauri (2026-02-09)
### 🔐 Seguridad runtime
- Sustituida configuracion insegura `csp: null` por una politica CSP explicita en:
  - `src-tauri/tauri.conf.json`
- Definida `csp` para produccion y `devCsp` para desarrollo local (`localhost:1420` y websocket de Vite).

### ✅ Estado de proteccion
- Se restringen origenes por defecto para scripts/conexiones/imagenes/fuentes.
- Se mantiene compatibilidad actual con `style-src 'unsafe-inline'` por uso de estilos inline existentes.

### 📚 Documentacion
- Actualizado `docs/SECURITY.md` con la nueva politica CSP, impacto y siguiente mejora recomendada.

## [v0.5.7] - Workflow CI con GitHub Actions (2026-02-09)
### ⚙️ Automatizacion
- Añadido workflow de CI en:
  - `.github/workflows/ci.yml`

### ✅ Pipeline definido
- Job `frontend-e2e` en Ubuntu:
  - `npm ci`
  - `npm test -- --run`
  - `npm run build`
  - `npx playwright install --with-deps chromium`
  - `npm run test:e2e`
- Job `rust-check` en Windows:
  - `cargo check --tests`

### 📚 Documentacion
- Actualizado `docs/TESTING.md` con seccion de CI y checks automatizados.

## [v0.5.6] - E2E Funcional Completo con Mock Tauri (2026-02-09)
### 🧪 E2E y estabilidad
- Implementado bridge unificado para Tauri en:
  - `src/shared/tauri/bridge.ts`
- Añadido modo mock E2E (`VITE_E2E_MOCK_TAURI=true`) en `playwright.config.ts`.
- Adaptados consumidores de `invoke/listen` al bridge:
  - `src/adapters/networkAdapter.ts`
  - `src/adapters/auditAdapter.ts`
  - `src/adapters/systemAdapter.ts`
  - `src/ui/hooks/modules/useJamming.ts`
  - `src/ui/hooks/modules/useTrafficMonitor.ts`
  - `src/ui/components/hud/HistoryPanel.tsx`

### ✅ Cobertura E2E ampliada
- `e2e/app.spec.ts` cubre flujos funcionales:
  - carga inicial,
  - scan de red,
  - carga de snapshot desde historial,
  - monitor de trafico en vivo,
  - seleccion de nodo + auditoria + alerta critica de gateway.

### 🛠️ Ajustes de calidad
- Corregido `useRouterHacker` para actualizar `routerRisk` y permitir visualizacion del modal de riesgo.
- Ajustada configuracion de Vitest para excluir `e2e/**` sin romper excludes por defecto (`configDefaults.exclude`).
- Actualizados tests unitarios para mockear el bridge:
  - `src/adapters/__tests__/networkAdapter.test.ts`
  - `src/adapters/__tests__/auditAdapter.test.ts`
  - `src/ui/hooks/modules/__tests__/useTrafficMonitor.test.ts`

### ✅ Verificacion
- `npm test -- --run` en verde (`33` tests).
- `npm run test:e2e` en verde (`6` tests).
- `npm run build` en verde.
- `cargo check --tests` en verde.

## [v0.5.5] - Base E2E con Playwright (2026-02-09)
### 🧪 E2E
- Añadida configuracion de Playwright:
  - `playwright.config.ts`
- Añadidos scripts npm:
  - `test:e2e`
  - `test:e2e:ui`
- Añadidos tests E2E iniciales:
  - `e2e/app.spec.ts`
  - Smoke de carga principal.
  - Apertura y cierre de panel de historial.

### ✅ Verificacion
- `npm run test:e2e` en verde (`2` tests).

## [v0.5.4] - Ampliacion de Cobertura en UI y Servicios (2026-02-09)
### 🧪 Frontend testing
- Añadidos tests de componentes criticos:
  - `src/ui/components/panels/__tests__/TrafficPanel.test.tsx`
  - `src/ui/components/__tests__/DangerModal.test.tsx`
  - `src/ui/components/hud/__tests__/DeviceDetailPanel.test.tsx`
- Añadido test de integracion para:
  - `src/ui/hooks/__tests__/useNetworkManager.test.ts`

### 🦀 Backend unit testing
- Añadidos tests unitarios en servicios Rust:
  - `src-tauri/src/application/audit_service.rs`
  - `src-tauri/src/application/history_service.rs`

### ✅ Verificacion
- `npm test -- --run` en verde (`33` tests).
- `npm run build` en verde.
- `cargo check --tests` en verde.

## [v0.5.3] - Cobertura de Testing para IPC y Trafico (2026-02-09)
### 🧪 Nuevos tests
- Añadidos tests de contratos IPC para adapters:
  - `src/adapters/__tests__/networkAdapter.test.ts`
  - `src/adapters/__tests__/auditAdapter.test.ts`
- Añadidos tests del hook de monitorizacion de trafico:
  - `src/ui/hooks/modules/__tests__/useTrafficMonitor.test.ts`
  - Cobertura de arranque/parada, procesamiento de paquetes, lista de paquetes interceptados y limpieza de buffers.

### ✅ Verificacion
- `npm test -- --run` en verde con la nueva suite.
- `npm run build` en verde.
- `cargo check` en verde.

## [v0.5.2] - Limpieza de Warnings en Backend Rust (2026-02-09)
### 🧹 Calidad de codigo
- Eliminados imports no usados en `src-tauri/src/application/jammer_service.rs`.
- Simplificado `NetworkScannerPort` eliminando el metodo no utilizado `resolve_vendor`.
- Actualizadas implementaciones y mocks afectados:
  - `src-tauri/src/infrastructure/system_scanner.rs`
  - `src-tauri/src/application/scanner_service.rs`
- Eliminado codigo muerto no referenciado:
  - `src-tauri/src/application/intel.rs` (y su export en `application/mod.rs`)
  - `src-tauri/src/domain/network_math.rs` (y su export en `domain/mod.rs`)

### ✅ Verificacion
- `cargo check` completado en verde y sin warnings.

## [v0.5.1] - Alineacion de Documentacion y Reglas de Calidad (2026-02-09)
### 📚 Documentacion
- Reescrito `AGENTS.md` con arquitectura real actual (`api/application/domain/infrastructure`) y flujo operativo para juniors/agentes IA.
- Actualizado `docs/ARCHITECTURE.md` para reflejar estructura vigente, comandos Tauri actuales y flujo IPC real (`invoke` + eventos).
- Actualizado `docs/SECURITY.md` con superficie de comandos expuesta, riesgos por modulo y checklist minimo pre-release.
- Creado `docs/TESTING.md` con estrategia por capas, comandos de validacion y roadmap de mejora de cobertura.

### ✅ Gobernanza de cambios
- Se establece como norma en `AGENTS.md` que todo cambio funcional, de arquitectura, de seguridad o testing debe registrarse en `docs/CHANGELOG.md`.
- Se añade el requisito de changelog en el flujo de trabajo y en la Definition of Done.

## [v0.5.0] - Migració a Rust & Tauri (Current)
### 🚀 Canvi de Motor (Engine Swap)
- **Rust Backend:** S'ha substituït tot el nucli de Node.js per **Rust**.
  - Ara l'escaneig de xarxa utilitza fils (Threads) natius per a màxim rendiment.
  - S'ha eliminat la dependència d'Electron. L'app ara pesa un 90% menys i és més ràpida.
- **Persistència Nativa:** Sistema d'historial reescrit per utilitzar rutes estàndard del sistema (`%APPDATA%` a Windows) gràcies al crate `directories`.
- **Rotació Automàtica:** Implementada lògica LIFO que manté només les últimes 50 sessions per estalviar espai.
- **Tauri Bridge:** Implementació de comandes `invoke` per comunicar Frontend i Backend sense latència.

### ✨ Millores de Seguretat (Intel)
- **Deep Audit Multithreaded:** L'escaneig de vulnerabilitats ara llança 12 fils simultanis per comprovar ports. És molt més ràpid que l'anterior seqüencial.
- **Smart Recon:** Detecció automàtica de serveis crítics (SMB, RDP, Telnet) amb assignació de nivell de risc en temps real.

### 🛠️ Tècnic
- **Arquitectura Hexagonal (Rust):**
  - `models.rs`: Entitats del Domini (Device, Vulnerability).
  - `network_commands.rs`: Casos d'Ús de Xarxa.
  - `history_commands.rs`: Adaptador de Persistència.
- **Neteja de Codi:** Eliminat tot el codi llegat de `src/core`. El Frontend ara és pur React/Vite.

## [v0.4.0] - Fase d'Intel·ligència (Vulnerability Matching)
### ✨ Afegit (Features)
- **Cyber Intelligence:** Creuament de ports amb Base de Coneixement de vulnerabilitats.
- **Avaluació de Risc:** Etiquetatge automàtic (`[SAFE]`, `[DANGER]`).
- **Stealth Mode Detection:** Visualització d'Escut Verd.

## [v0.3.0] - Fase de Defensa Activa (Kill Switch)
### ✨ Afegit
- **The Kill Switch:** Botó d'acció directa.
- **Arquitectura Jammer:** Preparada per ARP Spoofing.
- **Mode Simulació:** Logs visuals `[SPOOF]`.

## [v0.2.0] - Fase de Persistència
### ✨ Afegit
- **Historial de Vigilància:** Sessions anteriors.
- **Auto-Load:** Càrrega automàtica a l'inici.

## [v0.1.0] - MVP Inicial
### ✨ Afegit
- Escaneig bàsic, Visualització 3D Sistema Solar.
