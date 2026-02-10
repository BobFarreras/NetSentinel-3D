# 📜 DIARI DE DESENVOLUPAMENT (CHANGELOG)

Tots els canvis notables en el projecte NetSentinel seran documentats aquí.

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
