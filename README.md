<!-- README.md -->
<!-- Descripcion: overview del repo (stack, validaciones y enlaces) con foco en onboarding rapido. -->

# NetSentinel 3D (Rust + Tauri)

Aplicacion desktop de ciberseguridad **educativa y defensiva** para **descubrir**, **visualizar** y **auditar** una red (Cyber Range/Lab o redes con autorizacion explicita).

Principios:
- Frontend (React) solo orquesta UI y renderiza datos.
- Backend (Rust) ejecuta red/sistema/FS y expone comandos Tauri controlados.
- Contratos tipados Rust <-> TypeScript para evitar regresiones.

Documentos de referencia (punto de entrada):
- `AGENTS.md` (reglas del repo, validaciones, onboarding).
- `docs/README.md` (indice de documentacion).
- `docs/PROJECT_LINKS.md` (links del proyecto: repo, releases, presentacion si aplica).
- `docs/01_reference/ARCHITECTURE.md` (arquitectura real y mapa de comandos).
- `docs/01_reference/SECURITY.md` (politicas y hardening).
- `docs/02_guides/RELEASE_SOP.md` (protocolo de release via GitHub Actions: tags `v*`).
- `docs/01_reference/CHANGELOG.md` (registro de cambios relevantes).
- `docs/00_onboarding/FEATURE_README_TEMPLATE.md` (plantilla de README por feature, incluyendo interconexiones).
- `skills/README.md` (skills del repo: guias on-demand para tareas recurrentes).

## Stack
- Frontend: React + TypeScript + Vite + Three.js / React Three Fiber
- Backend: Rust + Tauri
- IPC: `invoke` + eventos Tauri (streaming en tiempo real)

## Funcionalidades principales
- **Network Scan + 3D**: descubre dispositivos (`scan_network`) y los renderiza en una escena 3D.
- **Device Audit (puertos)**: auditoria de puertos del objetivo (`audit_target`) con resultados visibles.
- **Gateway Audit (router)**: sincroniza inventario desde el router si es posible (`audit_router`, `fetch_router_devices`).
- **Live Traffic**: monitor de eventos de trafico (`start_traffic_sniffing` / `stop_traffic_sniffing`).
- **Radar WiFi**: escaneo de redes WiFi visibles (`scan_airwaves`).
- **History + Snapshot**: persistencia de sesiones (`save_scan`, `get_history`) y ultimo estado (`save_latest_snapshot`, `load_latest_snapshot`).
- **Attack Lab**: panel de escenarios reproducibles (LAB/CUSTOM) con streaming de logs.

## Patron frontend (resumen)
Para mantener escalabilidad y reducir deuda tecnica:
- Cada panel/escena usa un hook de estado (`useXxxState`) para efectos, memos y handlers.
- Los componentes de UI quedan como capas de presentacion (subcomponentes puros).
- Los estilos/tokens compartidos se centralizan en `src/ui/styles/hudTokens.ts`.

Aplicado ya en:
- `RadarPanel`, `ConsoleLogs`, `TrafficPanel`, `DeviceDetailPanel`.
- Capa 3D: `NetworkScene`, `NetworkNode`, `NodeLabel`.

## Estructura del repo (resumen)
```text
/src                 # Frontend (React + Vite)
/src-tauri           # Backend (Rust + Tauri)
/docs                # Documentacion tecnica
AGENTS.md            # Guia operativa para agentes IA/juniors
```

Estructura (un poco mas detallada):
```text
src/
  adapters/                  # IPC: wrappers de invoke/listen
  shared/dtos/               # Contratos TypeScript (DTOs)
  shared/tauri/              # Bridge IPC + mocks E2E
  ui/features/               # Features (paneles) con README por carpeta
src-tauri/src/
  api/commands/              # Comandos Tauri por feature
  application/               # Casos de uso (servicios) por dominio
  domain/                    # Entidades y puertos (hexagonal)
  infrastructure/            # Red/FS/wifi/router audit/etc.
docs/
  README.md                  # Indice de documentacion
  PROJECT_LINKS.md           # Links del proyecto (repo/releases/presentacion)
  00_onboarding/             # Plantillas y reglas para documentar
  01_reference/              # Arquitectura, seguridad, changelog, testing
  02_guides/                 # Guias paso a paso (release, radar, attack lab, etc.)
  99_archive/                # Historico (si aplica)
```

## Setup (dev)
Requisitos:
- Node.js (LTS recomendado)
- Rust (rustup + cargo)

Instalacion:
```bash
npm install
```

Arranque (Tauri + Vite):
```bash
npm run tauri dev
```

Build local (instalador/bundle):
```bash
npm run tauri build
```

## Validaciones minimas (antes de cerrar tareas)
Frontend:
```bash
npm test -- --run
npm run build
```

Backend:
```bash
cd src-tauri
cargo check
cargo test
```

Nota Windows:
- `cargo test` puede fallar por linking de `Packet.lib`. Si ocurre, registrar incidencia y continuar con `cargo check` como validacion minima.

### Testing por capas (frontend)
- Unit (hooks):
  - `src/ui/hooks/modules/__tests__/*`
  - valida estado, efectos y reglas de negocio UI.
- Integracion (componentes/paginas):
  - `src/ui/components/**/__tests__/*`
  - `src/__tests__/App.integration.test.tsx`
  - valida sincronizacion entre escena, paneles y consola.

## LIVE TRAFFIC (guia rapida)
El panel `LIVE TRAFFIC` muestra paquetes capturados en tiempo real.

Colores:
- Verde: trafico normal (no interceptado).
- Amarillo: trafico normal (otros protocolos/heuristicas).
- Rojo: paquete marcado como interceptado (`isIntercepted = true`).

Columnas:
- `TYPE`: protocolo (`TCP`, `UDP`, etc.) o tipo derivado.
- `SRC`: origen (prioriza `vendor/hostname` si existe).
- `DST`: destino (misma regla de resolucion que `SRC`).
- `DATA`: resumen (por ejemplo `pkt.info`).

## Radar View (WiFi Spectrum)
Documento tecnico: `docs/02_guides/RADAR_VIEW.md`.

Notas Windows:
- Para escanear WiFi pueden requerirse permisos de ubicacion.
- Algunos drivers cachean resultados; el backend fuerza un “trigger” best-effort para refrescar el scan.

## Attack Lab / LAB Audit
Laboratorio de escenarios reproducibles:
- `LAB`: ejecucion local/pasiva o presets controlados.
- `CUSTOM`: wrapper para herramientas externas ya instaladas por el administrador.

Documento tecnico: `docs/02_guides/ATTACK_LAB.md`.

## Paneles desacoplados (desktop)
- Los paneles `Console`, `Device`, `Radar`, `AttackLab` y `NetworkScene` soportan modo desacoplado.
- En Tauri desktop se abren en ventana nativa independiente.
- El cierre oficial del panel desacoplado es el `X` nativo de la ventana (reacopla automaticamente en la principal).
