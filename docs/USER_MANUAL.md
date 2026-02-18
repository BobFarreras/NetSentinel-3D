<!-- docs/USER_MANUAL.md -->
<!-- Descripcion: manual simple (estilo "lavadora") para entender el proyecto y trabajar sin romperlo. -->

# Manual de NetSentinel 3D

Este manual esta escrito para que alguien nuevo entienda el proyecto rapido.

## 1) Index (por donde empiezo)
1. Para correr la app: `README.md` (raiz)
2. Para saber "donde esta cada cosa": `docs/README.md`
3. Para enlaces (repo/releases/presentacion): `docs/PROJECT_LINKS.md`

## 2) Features (que hace la app)

### 2.1 Scan de red (descubrir dispositivos)
Que ves:
- Boton/accion de SCAN en la UI.
- Nodos aparecen en la escena 3D.

Que hace por debajo:
- UI llama al comando Tauri `scan_network`.
- Backend devuelve `DeviceDTO[]`.

Codigo:
- UI: `src/ui/hooks/useNetworkManager.ts`
- Backend: `src-tauri/src/application/scan/*`

### 2.2 Device Audit (puertos)
Que ves:
- Seleccionas un nodo y ejecutas auditoria (puertos).
- Ves puertos en Device Detail.

Que hace por debajo:
- UI llama a `audit_target`.
- Backend devuelve puertos + señales basicas.

Codigo:
- UI: `src/ui/features/device_detail/*`
- Backend: `src-tauri/src/application/audit/*`

### 2.3 Gateway Audit (router)
Que ves:
- Auditoria del gateway y, si funciona, inventario del router.

Que hace por debajo:
- `audit_router` y/o `fetch_router_devices`.
- Puede usar credenciales guardadas (keyring) y presets (JSON).

Doc:
- Seguridad y rutas: `docs/01_reference/SECURITY.md`

### 2.4 Radar WiFi
Que ves:
- Lista de redes WiFi con señal/canal/seguridad.

Que hace por debajo:
- UI llama a `scan_airwaves`.

Doc:
- `docs/02_guides/RADAR_VIEW.md`

### 2.5 Live Traffic
Que ves:
- Tabla de eventos en tiempo real.

Que hace por debajo:
- UI llama a `start_traffic_sniffing`.
- Backend emite eventos `traffic-event`.
- UI escucha el evento y va pintando.

Codigo:
- UI: `src/ui/features/traffic/*`
- Backend: `src-tauri/src/application/traffic/*`

### 2.6 Attack Lab (LAB / CUSTOM)
Que ves:
- Panel para ejecutar escenarios con logs.

Que hace por debajo:
- `LAB`: ejecucion local/pasiva o presets.
- `CUSTOM`: backend ejecuta un proceso y stream de logs.

Doc:
- `docs/02_guides/ATTACK_LAB.md`

## 3) Estructura del proyecto (donde esta cada cosa)
```text
src/                          # Frontend
  adapters/                   # IPC: invoke/listen
  shared/dtos/                # Contratos TS
  shared/tauri/               # Bridge IPC + mock E2E
  ui/features/                # Features/paneles

src-tauri/src/                # Backend
  api/commands/               # Comandos Tauri
  api/dtos.rs                 # DTOs Rust
  application/                # Casos de uso
  domain/                     # Entidades + puertos
  infrastructure/             # Implementaciones I/O

docs/                         # Documentacion (este manual)
```

## 4) Mantenimiento (buenas practicas)
Reglas simples:
1. No rompas contratos Rust/TS:
   - Rust: `src-tauri/src/api/dtos.rs`
   - TS: `src/shared/dtos/NetworkDTOs.ts`
2. Si cambias un comando Tauri: actualiza UI + docs en el mismo cambio.
3. Evita “god files”: extrae hooks/servicios por feature.
4. Corre validaciones minimas antes de cerrar cambios:
```bash
npm test -- --run
npm run build
cd src-tauri
cargo check
```

## 5) Release / deploy (profesional)
Paso a paso:
- `docs/02_guides/RELEASE_SOP.md`
