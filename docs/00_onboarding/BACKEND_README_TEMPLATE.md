<!-- docs/00_onboarding/BACKEND_README_TEMPLATE.md -->
<!-- Descripcion: plantilla para README.md de modulos backend (Rust). Pensada para que un junior entienda el modulo y no rompa contratos. -->

# Plantilla: README backend (por modulo/feature)

Objetivo: que alguien nuevo pueda responder rapido:
- Que hace este modulo?
- Que comandos Tauri expone (si aplica)?
- Que DTOs usa?
- Donde estan los puntos de entrada?
- Que dependencias (puertos/infra) toca?
- Como se prueba?

---

## 1) Nombre
`<ModuloBackend>`

Ejemplos:
- `scan`
- `audit`
- `traffic`
- `wifi`
- `attack_lab`

## 2) Que hace (en 3 lineas)
- Que hace: ...
- Para que sirve: ...
- Que devuelve o que evento emite: ...

## 3) Donde vive (rutas)
- Commands (si aplica): `src-tauri/src/api/commands/<feature>.rs`
- Application: `src-tauri/src/application/<feature>/`
- Domain (puertos/entidades): `src-tauri/src/domain/*`
- Infra (I/O): `src-tauri/src/infrastructure/<feature>/`

## 4) Comandos Tauri (si aplica)
Lista:
- `comando_1`
  - Entrada (DTO): `...` (Rust: `src-tauri/src/api/dtos.rs`)
  - Salida (DTO): `...`
  - Notas: timeouts, permisos, errores tipicos

## 5) Eventos (si aplica)
- `nombre-evento`
  - Payload: ...
  - Quien lo emite: (archivo Rust)
  - Quien lo consume: (feature frontend)

## 6) DTOs (contratos)
TS:
- `src/shared/dtos/NetworkDTOs.ts` (tipos: ...)

Rust:
- `src-tauri/src/api/dtos.rs` (tipos: ...)

Regla:
- Si cambias un DTO, actualiza ambos lados en el mismo cambio.

## 7) Puertos de dominio (dependencias)
Lista de traits usados:
- `src-tauri/src/domain/ports.rs`: `...`

## 8) Persistencia y rutas (si aplica)
- Archivo/ruta: ...
- API usada: (ej: `directories`, Tauri `app_config_dir`, keyring)
- Formato: JSON, etc.

## 9) Errores tipicos (y como debuggear)
- ...

## 10) Tests
- Unit (backend): `src-tauri/src/application/<feature>/*` (o `infrastructure/*` si hay parsers)
- Fixtures (si aplica): `src-tauri/src/infrastructure/<feature>/fixtures/*`
- Validaciones minimas:
```bash
cd src-tauri
cargo check
```

---

## Ejemplo mini (relleno)
Nombre: `traffic`

Que hace:
- Inicia/parada de captura de trafico y emite eventos a la UI.

Comandos:
- `start_traffic_sniffing` / `stop_traffic_sniffing`

Evento:
- `traffic-event`

