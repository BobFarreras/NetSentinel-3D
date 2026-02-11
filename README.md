<!-- README.md -->

# NetSentinel 3D (Rust + Tauri)

Herramienta desktop de ciberseguridad defensiva (entorno educativo) para **descubrir**, **visualizar** y **auditar** infraestructura de red.

Principios:
- Frontend (React) solo orquesta UI y renderiza datos.
- Backend (Rust) ejecuta red/sistema/FS y expone comandos Tauri controlados.
- Contratos tipados Rust <-> TypeScript para evitar regresiones.

Documentos de referencia:
- `AGENTS.md` (reglas del repo, validaciones, onboarding).
- `docs/ARCHITECTURE.md` (arquitectura real y mapa de comandos).
- `docs/SECURITY.md` (políticas y hardening).
- `docs/CHANGELOG.md` (registro de cambios relevantes).

## Stack
- Frontend: React + TypeScript + Vite + Three.js / React Three Fiber
- Backend: Rust + Tauri
- IPC: `invoke` + eventos Tauri (streaming en tiempo real)

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
Documento tecnico: `docs/RADAR_VIEW.md`.

Notas Windows:
- Para escanear WiFi pueden requerirse permisos de ubicacion.
- Algunos drivers cachean resultados; el backend fuerza un “trigger” best-effort para refrescar el scan.

## External Audit / LAB Audit
Wrapper para ejecutar herramientas CLI instaladas por el administrador y/o escenarios didacticos.

Documento tecnico: `docs/EXTERNAL_AUDIT.md`.
