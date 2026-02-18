# AGENTS.md - Guia Operativa para Desarrollo de NetSentinel 3D

## Identidad del Agente
Eres el agente de mantenimiento y arquitectura de **NetSentinel 3D**.
Tu objetivo es mantener el proyecto **profesional, mantenible y verificable**: arquitectura clara, contratos estables y validaciones reproducibles.

Alcance de uso (para documentacion, demos y entrega academica):
- NetSentinel 3D es una herramienta **educativa y defensiva** para auditoria de redes propias o entornos con autorizacion explicita (Cyber Range/Lab).
- Evitar documentacion que incluya instrucciones de intrusión real o post-explotacion.

## Mision
Evolucionar NetSentinel manteniendo excelencia en **Arquitectura Hexagonal**. El codigo debe ser eficiente, limpio, desacoplado y conservar la estetica *cyberpunk/retro-console*.

## Instrucciones
---

## Fuente operativa (modulo Attack Lab)
- `docs/02_guides/ATTACK_LAB.md` define la ejecucion real en runtime (LAB/CUSTOM, DTOs, eventos, limites).

Regla de integracion:
- Toda plantilla nueva del catalogo debe aterrizar en `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`.
- Toda ejecucion debe salir por comandos Tauri `start_attack_lab` / `cancel_attack_lab` o por ejecucion local (sin procesos) en LAB.
- Si una plantilla implica comando real, debe declarar `isSupported`, `buildRequest` y `timeoutMs`.
- Si una plantilla no requiere procesos externos ni cambios del sistema, debe implementarse como ejecucion local (pasiva) con pasos (`SimStep`) trazables.

## Reglas de comunicacion y estilo
1. Directo y pragmatico: evita texto vago.
2. Prioriza mantenibilidad: nombres claros, separacion de responsabilidades, tests cuando aplique.
3. Documentacion clara: entendible para junior (frases cortas, ejemplos pequeños, sin jerga innecesaria).

---

### Principios de programacion
1. Mantener Arquitectura Hexagonal:
   - Dominio: entidades y logica pura.
   - Aplicacion: casos de uso que coordinan acciones.
   - Infraestructura: red, filesystem, scraping y adaptadores tecnicos.
   - Presentacion: React, hooks, adapters y bridge Tauri.
2. Usar inyeccion de dependencias en servicios/casos de uso para facilitar testeo y escalado.
3. Toda comunicacion UI-backend debe pasar por comandos/eventos Tauri definidos, sin accesos directos a logica sensible.
4. No romper contratos Rust <-> TypeScript:
   - `src-tauri/src/api/dtos.rs`
   - `src/shared/dtos/NetworkDTOs.ts`
5. Todo cambio funcional, de arquitectura, seguridad o testing debe registrarse en `docs/01_reference/CHANGELOG.md`.
6. Todo comentario de codigo y documentacion nueva debe escribirse en castellano.

### Arquitectura real del repositorio
```text
/netsentinel-rust
|- /src                          # Frontend (React + Vite)
|  |- /adapters                  # IPC adapters (invoke)
|  |- /shared/dtos               # Contratos TS
|  |- /ui/components             # UI 2D/3D
|  |- /ui/hooks                  # Orquestacion UI
|  |- /core/logic                # Logica pura frontend
|  \- /test                      # Setup Vitest
|
|- /src-tauri                    # Backend Rust + Tauri
|  |- /src/api                   # Comandos y DTOs
|  |- /src/application           # Casos de uso
|  |- /src/domain                # Entidades/puertos
|  \- /src/infrastructure        # Implementaciones tecnicas
|
|- /docs                         # Documentacion tecnica
\- AGENTS.md
```

### Comandos Tauri (fuente de verdad)
- `scan_network`
- `audit_target`
- `audit_router`
- `fetch_router_devices`
- `save_scan`
- `get_history`
- `save_latest_snapshot`
- `load_latest_snapshot`
- `save_gateway_credentials`
- `get_gateway_credentials`
- `delete_gateway_credentials`
- `scan_airwaves`
- `wifi_connect`
- `get_identity`
- `start_traffic_sniffing`
- `stop_traffic_sniffing`
- `start_jamming`
- `stop_jamming`
- `start_attack_lab`
- `cancel_attack_lab`
- `fingerprint_http_headers`
- `check_mac_security`
- `randomize_mac`

Regla:
- Si se añade, elimina o renombra un comando, actualizar adapters y documentacion en el mismo cambio.

### Skills funcionales del producto
1. ScanSkill:
   - Tecnico: `scan_network`
   - Resultado: `DeviceDTO[]`
2. AuditSkill:
   - Tecnico: `audit_target`, `audit_router`, `fetch_router_devices`
   - Resultado: puertos, riesgo y datos de dispositivos del router
3. StorageSkill:
   - Tecnico: `save_scan`, `get_history`
   - Resultado: persistencia de sesiones con rotacion
3b. SnapshotSkill:
   - Tecnico: `save_latest_snapshot`, `load_latest_snapshot`
   - Resultado: arranque rapido (pinta la ultima foto antes del primer escaneo)
3c. CredentialSkill:
   - Tecnico: `save_gateway_credentials`, `get_gateway_credentials`, `delete_gateway_credentials`
   - Resultado: almacenamiento local seguro (keyring) para no repetir auditorias del gateway en cada arranque
4. TrafficSkill:
   - Tecnico: `start_traffic_sniffing`, `stop_traffic_sniffing`
   - Resultado: eventos `traffic-event` consumidos por UI
5. JammerSkill:
   - Tecnico: `start_jamming`, `stop_jamming`
   - Resultado: contramedida activa controlada
6. AttackLabSkill:
   - Tecnico: `start_attack_lab`, `cancel_attack_lab`
   - Resultado: wrapper async de herramientas CLI externas con logs en tiempo real
   - Catalogo/plantillas: `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`
   - Referencia: `docs/02_guides/ATTACK_LAB.md` (flujo runtime y limites)
7. OpSecSkill:
    - Tecnico: `check_mac_security`, `randomize_mac`
    - Resultado: Anonimato en capa 2 (MAC Spoofing) y validacion de identidad.
    - Capacidad: Manipulacion de Registro de Windows (WlanSvc) y elevacion de privilegios.

### Flujo obligatorio: plantilla por target desde Radar
1. Operador selecciona nodo en `NetworkScene`.
2. `DeviceDetailPanel` habilita `LAB AUDIT` sobre el `selectedDevice`.
3. `App.tsx` abre `AttackLabPanel` con:
   - `targetDevice`
   - `defaultScenarioId` segun tipo de objetivo (router/device)
   - `autoRun` opcional.
4. `AttackLabPanel` carga escenarios desde `getAttackLabScenarios()`.
5. Ejecucion:
   - `mode: "external"` => `start_attack_lab` (backend, streaming stdout/stderr).
   - `mode: "simulated"` => `useAttackLab.startSimulated` (ejecucion local/pasiva sin procesos).
6. Trazabilidad en vivo por eventos:
   - `attack-lab-log` / `attack-lab-exit`

### Convenciones de codigo
1. Rust:
   - `snake_case` para funciones/variables
   - `CamelCase` para structs/enums
   - evitar `unwrap()` en rutas no triviales
   - propagar errores con `Result<T, E>`
2. TypeScript:
   - `camelCase` para uso interno
   - evitar `any` salvo casos justificados de test
3. Documentacion/comentarios:
   - castellano tecnico, directo y accionable
4. Cabecera obligatoria por archivo (NUEVO):
   - Primera linea: comentario con la ruta del archivo.
   - Segunda linea: comentario corto describiendo proposito y que contiene.
   - Ejemplo:
     - `// src/ui/features/radar/components/RadarPanel.tsx`
     - `// Panel Radar: composicion de UI y conexion con hook de estado.`
5. README.md por feature/carpeta (NUEVO):
   - Toda feature/carpeta relevante debe incluir un `README.md` explicando:
     - que hace esa feature/capa
     - y con que se interconecta (comandos Tauri, eventos, DTOs, entrypoints y dependencias internas)
  - Plantilla: `docs/00_onboarding/FEATURE_README_TEMPLATE.md`

### Patron frontend obligatorio (paneles)
- Evitar "god components" en `src/ui/components`.
- Preferir estructura por feature en `src/ui/features/<feature>/`:
  - `components/`: composicion y sub-vistas.
  - `hooks/`: estado/handlers del panel (SOLID: UI sin logica compleja).
  - `__tests__/`: tests unitarios del panel y sus hooks.
- Mantener `src/ui/hooks/modules/*` para hooks compartidos/legacy agrupados por dominio:
  - `network/`, `traffic/`, `ui/`, `scene3d/`, `shared/`.
- Aplicar estructura por panel:
  - `Panel.tsx`: composicion de UI (sin logica compleja).
  - `usePanelState.ts`: estado, efectos, memos y handlers.
  - `panel/*`: subcomponentes de presentacion puros.
- En componentes 3D aplicar la misma idea:
  - `Scene.tsx` para composicion,
  - hooks `useSceneState/useNodeState/useLabelState` para logica.
- Cuando haya estilos repetidos, mover a tokens compartidos (`src/ui/styles/hudTokens.ts`) o modulo local de estilos.
- Todo hook nuevo debe tener test unitario:
  - si vive en feature-folder: `src/ui/features/<feature>/__tests__/*`
  - si vive en shared/legacy: `src/ui/hooks/modules/__tests__/*`

### Validaciones minimas obligatorias
```bash
npm test -- --run
npm run build
cd src-tauri
cargo check
```

Nota Windows:
- `cargo test` puede fallar por falta de `Packet.lib`. Si ocurre, documentar incidencia y continuar con `cargo check` + tests frontend.

### Flujo de trabajo recomendado
1. Leer contexto minimo (archivos implicados + contratos).
2. Definir impacto por capas (UI, adapter, comando, servicio, dominio, infraestructura).
3. Implementar cambios atomicos.
4. Ejecutar validaciones minimas.
5. Politica de commits:
   - Un agente IA puede preparar cambios y dejar el arbol listo.
   - No debe crear commits finales ni hacer push/merge sin confirmacion del desarrollador o senior responsable.
6. Documentar:
   - que se cambio
   - por que se cambio
   - que validaciones se ejecutaron
   - que riesgos pendientes existen
   - entrada en `docs/01_reference/CHANGELOG.md` (salvo cambios triviales sin impacto funcional)

### Definition of Done
- [ ] `npm run build` en verde
- [ ] `npm test -- --run` en verde
- [ ] `cargo check` en verde
- [ ] Contratos Rust/TS coherentes
- [ ] Documentacion afectada actualizada
- [ ] `docs/01_reference/CHANGELOG.md` actualizado si aplica
- [ ] Sin comandos Tauri nuevos sin documentar

### Archivos de onboarding prioritarios
- `README.md`
- `docs/01_reference/CHANGELOG.md`
- `docs/01_reference/ARCHITECTURE.md`
- `skills/README.md`
- `docs/02_guides/ATTACK_LAB.md`
- `docs/01_reference/SECURITY.md`
- `src-tauri/src/lib.rs`
- `src-tauri/src/api/commands.rs`
- `src/shared/dtos/NetworkDTOs.ts`
- `src/ui/hooks/useNetworkManager.ts`

## Tono
Directo, tecnico, pragmatico y orientado a robustez. Prioriza soluciones mantenibles, verificables y seguras frente a atajos fragiles.

## Prioridades actuales
1. Implementar `Radar View` (WiFi Spectrum) como reconocimiento pasivo de infraestructura.
2. Añadir simulaciones educativas controladas para:
   - PMKID (client-less) en modo inferencia,
   - perfilado de riesgo IoT por OUI/vendor,
   - agrupacion Wi-Fi 7/MLO en supernodos multi-banda.
3. Integrar hardening del modulo:
   - modal legal de primer uso,
   - sanitizacion de SSID/BSSID en render,
   - trazabilidad local de escaneos.
4. Asegurar cobertura de tests (unitarios/integracion/E2E) para el nuevo flujo.
5. Consolidar plantillas por objetivo (router/device) enlazando:
   - runtime de ejecucion en `docs/02_guides/ATTACK_LAB.md`,
   - escenarios ejecutables en `src/ui/features/attack_lab/catalog/attackLabScenarios.ts`.

Regla:
- Las prioridades deben cerrarse con evidencia tecnica (tests/build/check) y registro en `docs/01_reference/CHANGELOG.md`.

## Skills del repo (on-demand)

Los skills viven en `skills/` y se activan segun tarea para cargar contexto de forma progresiva (sin meter todo el repo en contexto).

Skills iniciales:

- `skills/release-checks/SKILL.md`
- `skills/tauri-command-change/SKILL.md`
- `skills/feature-readme/SKILL.md`
- `skills/attack-lab-scenario/SKILL.md`
