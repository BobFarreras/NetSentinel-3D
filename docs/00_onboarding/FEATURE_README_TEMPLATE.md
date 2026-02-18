<!-- docs/00_onboarding/FEATURE_README_TEMPLATE.md -->
<!-- Descripcion: plantilla para README.md por feature/carpeta. Pensada para que un junior entienda el flujo en 2 minutos. -->

# Plantilla: README por feature

Objetivo: que alguien nuevo pueda responder rapido:
- Que hace esta feature?
- Donde esta el codigo?
- Que comandos/eventos/DTOs usa?
- Que tests existen?

---

## 1) Nombre
`<FeatureName>`

## 2) Que hace (en 3 lineas)
- Que hace: ...
- Para que sirve: ...
- Que ves en UI (si aplica): ...

## 3) Que NO hace (limites)
- ...

## 4) Donde vive (rutas)
- Frontend (si aplica): `src/ui/features/<feature>/`
- Backend (si aplica): `src-tauri/src/application/<feature>/` + `src-tauri/src/api/commands/<feature>.rs`

## 5) Entradas y salidas (inputs/outputs)
Entradas:
- UI entrypoint: (ej: `src/App.tsx` o `src/ui/components/layout/*`)
- Hook principal: (ej: `src/ui/features/<feature>/hooks/useXxx.ts`)
- Props/contexto: ...

Salidas:
- Estado: ...
- UI: ...
- Navegacion/paneles: ...

## 6) IPC (si habla con el backend)
- Comandos Tauri: `...`
- Eventos Tauri: `...`
- DTOs:
  - TS: `src/shared/dtos/NetworkDTOs.ts` (tipos: ...)
  - Rust: `src-tauri/src/api/dtos.rs` (tipos: ...)

## 7) Dependencias internas (si aplica)
- Adapter: `src/adapters/<x>Adapter.ts`
- Backend service: `src-tauri/src/application/<feature>/service.rs`
- Puertos (backend): `src-tauri/src/domain/ports.rs`

## 8) Flujo (receta en 6-8 pasos)

1. ...
2. ...
3. ...
4. ...

## 9) Tests

- Unit (frontend): `src/ui/features/<feature>/__tests__/*`
- Unit (backend): `src-tauri/src/application/<feature>/*`
- E2E (si aplica): `e2e/*`

## 10) Notas (solo si hace falta)

- Riesgos: ...
- Deuda tecnica intencional: ...

---

## Ejemplo mini (relleno)
Nombre: `Traffic`

Que hace:
- Muestra eventos de trafico en tiempo real en una tabla.

IPC:
- Comandos: `start_traffic_sniffing`, `stop_traffic_sniffing`
- Evento: `traffic-event`
