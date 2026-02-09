# AGENTS.md - Guia Operativa para NetSentinel 3D (Rust + Tauri)

## 1. Mision del Proyecto
Construir y mantener NetSentinel 3D como aplicacion de ciberseguridad defensiva de escritorio:
- Backend en Rust para rendimiento, concurrencia y seguridad de memoria.
- Frontend en React para visualizacion y control de estado.
- Contratos tipados Rust <-> TypeScript para evitar regresiones.

Este documento define como debe trabajar un agente IA o un desarrollador nuevo dentro del repositorio.

## 2. Reglas Globales de Colaboracion
- Todo comentario de codigo y documentacion nueva debe escribirse en castellano.
- Priorizar cambios pequeños, verificables y con impacto claro.
- No romper contratos de datos entre `src-tauri/src/api/dtos.rs` y `src/shared/dtos/NetworkDTOs.ts`.
- Todo cambio funcional, de arquitectura, de seguridad o de testing debe registrarse en `docs/CHANGELOG.md`.
- Antes de cerrar una tarea, ejecutar validaciones minimas (seccion 8).

## 3. Arquitectura Real del Proyecto
La arquitectura actual es modular y hexagonal pragmatica.

```text
/netsentinel-rust
|- /src                          # Frontend (React + Vite)
|  |- /adapters                  # IPC adapters (invoke a comandos Tauri)
|  |- /shared/dtos               # Contratos TS compartidos con Rust
|  |- /ui/components             # UI 2D/3D
|  |- /ui/hooks                  # Orquestacion de UI
|  |- /core/logic                # Logica pura de frontend (ej: intrusos)
|  \- /test                      # Setup de tests Vitest
|
|- /src-tauri                    # Backend (Rust + Tauri)
|  |- /src/api                   # Comandos Tauri y DTOs de salida
|  |- /src/application           # Casos de uso
|  |- /src/domain                # Entidades y puertos
|  \- /src/infrastructure        # Adaptadores de red, fs, scraping, etc.
|
|- /docs                         # Documentacion tecnica del proyecto
\- AGENTS.md                     # Guia de trabajo para agentes IA/devs
```

## 4. Capas y Responsabilidades
### 4.1 Frontend (React)
- Solo visualiza y orquesta estado de interfaz.
- Debe delegar operaciones de red/sistema al backend via adapters (`invoke`).
- Archivos clave:
  - `src/adapters/networkAdapter.ts`
  - `src/adapters/auditAdapter.ts`
  - `src/ui/hooks/useNetworkManager.ts`
  - `src/App.tsx`

### 4.2 Backend (Rust)
- Define logica de escaneo, auditoria, historial, trafico y jamming.
- Expone comandos Tauri en `src-tauri/src/api/commands.rs` y `src-tauri/src/lib.rs`.
- Usa dominio + puertos para desacoplar casos de uso de infraestructura.

### 4.3 Contratos de Datos
- Rust serializa principalmente en `camelCase` con `serde`.
- TypeScript debe reflejar estructura y tipos de los DTOs de Rust.
- Cualquier cambio de contrato requiere actualizar:
  - `src-tauri/src/api/dtos.rs`
  - `src-tauri/src/domain/entities.rs` (si aplica)
  - `src/shared/dtos/NetworkDTOs.ts`
  - Adaptadores y hooks consumidores

## 5. Comandos Tauri Actuales (Fuente de Verdad)
Comandos registrados en `src-tauri/src/lib.rs`:
- `scan_network`
- `audit_target`
- `audit_router`
- `fetch_router_devices`
- `save_scan`
- `get_history`
- `get_identity`
- `start_traffic_sniffing`
- `stop_traffic_sniffing`
- `start_jamming`
- `stop_jamming`

Regla:
- Si se añade, elimina o renombra un comando, actualizar documentacion y adapters TS en el mismo cambio.

## 6. Skills Funcionales del Sistema (Nivel Producto)
### 6.1 ScanSkill
- Tecnico: `scan_network`
- Flujo: UI -> adapter -> comando Tauri -> `ScannerService` -> infraestructura de red
- Resultado: lista de dispositivos (`DeviceDTO[]`)

### 6.2 AuditSkill
- Tecnico: `audit_target` + `audit_router` + `fetch_router_devices`
- Flujo:
  - Auditoria de puertos por IP.
  - Auditoria de gateway (credenciales por defecto y extraccion de datos de router).
- Resultado: riesgo, puertos abiertos y datos de dispositivos del router.

### 6.3 StorageSkill
- Tecnico: `save_scan` + `get_history`
- Flujo: persistencia de sesiones en repositorio de ficheros (`FileHistoryRepository`).
- Regla funcional: historial con rotacion (mantener sesiones recientes).

### 6.4 TrafficSkill
- Tecnico: `start_traffic_sniffing` + `stop_traffic_sniffing`
- Flujo: captura de trafico, emision de eventos `traffic-event` y consumo en hook UI.

### 6.5 JammerSkill
- Tecnico: `start_jamming` + `stop_jamming`
- Flujo: contramedida activa sobre un objetivo usando gateway conocido.

## 7. Convenciones de Codigo
### 7.1 Rust
- `snake_case` para funciones y variables.
- `CamelCase` para structs/enums.
- Evitar `unwrap()` en rutas de ejecucion no triviales.
- Propagar errores con `Result<T, E>` y mensajes utiles.

### 7.2 TypeScript
- `camelCase` para variables, funciones y propiedades de uso interno.
- Evitar `any` salvo en tests puntuales con justificacion.
- Mantener hooks con responsabilidad unica cuando sea viable.

### 7.3 Comentarios y docs
- Castellano tecnico, directo y accionable.
- Evitar comentarios decorativos; explicar decisiones o invariantes.

## 8. Validaciones Minimas Obligatorias
Ejecutar antes de cerrar una tarea de codigo:

```bash
npm test -- --run
npm run build
```

Para backend Rust (compilacion):

```bash
cd src-tauri
cargo check
```

Nota para Windows:
- `cargo test` puede fallar si falta `Packet.lib` (dependencia nativa asociada a `pnet`/captura).
- Si falla por linking, registrar el motivo en la PR/tarea y continuar con `cargo check` + tests frontend.

## 9. Flujo de Trabajo Recomendado para Agentes IA
1. Leer contexto minimo (archivos implicados + contratos).
2. Definir impacto del cambio por capas (UI, adapter, comando, servicio, dominio, infra).
3. Implementar cambios de forma atomica.
4. Ejecutar validaciones minimas.
5. Documentar:
   - que se cambio
   - por que se cambio
   - que validaciones se ejecutaron
   - que riesgos pendientes quedan
   - entrada correspondiente en `docs/CHANGELOG.md` (salvo cambios triviales sin impacto funcional)

## 10. Checklist de Definition of Done
- [ ] Codigo compila en frontend (`npm run build`).
- [ ] Tests frontend relevantes en verde (`npm test -- --run`).
- [ ] Backend verificado con `cargo check`.
- [ ] Contratos Rust/TS actualizados y coherentes.
- [ ] Documentacion afectada actualizada.
- [ ] `docs/CHANGELOG.md` actualizado para cambios relevantes.
- [ ] No se introducen comandos Tauri sin registrar en docs/adapters.

## 11. Archivos de Alta Prioridad para Onboarding
- `README.md`
- `docs/CHANGELOG.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `src-tauri/src/lib.rs`
- `src-tauri/src/api/commands.rs`
- `src/shared/dtos/NetworkDTOs.ts`
- `src/ui/hooks/useNetworkManager.ts`

Mantener estos archivos alineados reduce el tiempo de onboarding de juniors y evita errores de agentes IA.
