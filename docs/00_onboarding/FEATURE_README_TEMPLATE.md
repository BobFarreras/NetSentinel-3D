<!-- docs/FEATURE_README_TEMPLATE.md -->
<!-- Descripcion: plantilla para README.md por feature/carpeta, con foco en interconexiones (comandos, eventos, DTOs y entrypoints). -->

# Nombre De Feature

Resumen en 2-4 lineas: que hace esta feature y por que existe.

## Ubicacion

- Carpeta: `src/ui/features/<feature>/` o `src-tauri/src/<capa>/<modulo>/`

## Responsabilidad

- Que hace: ...
- Que NO hace: ...

## Interconexiones

Entradas:
- UI entrypoint: (ej: `src/ui/components/layout/MainDockedLayout.tsx` o `DetachedPanelView.tsx`)
- Props esperadas / contexto: ...

Salidas:
- Estado/UI: ...
- Navegacion / paneles: ...

IPC (si aplica):
- Comandos Tauri: `...`
- Eventos Tauri: `...`
- DTOs compartidos: `src/shared/dtos/NetworkDTOs.ts` (tipos: ...)

Dependencias internas (si aplica):
- Adapters: `src/adapters/<x>Adapter.ts`
- Hooks/servicios: `src/ui/features/<feature>/hooks/*` o `src-tauri/src/application/<modulo>/*`
- Puertos de dominio (backend): `src-tauri/src/domain/ports.rs`

## Flujo (alto nivel)

1. ...
2. ...
3. ...

## Tests

- Unit: `src/ui/features/<feature>/__tests__/*` o `src-tauri/src/...`
- Consideraciones: ...

## Notas

- Riesgos / deuda tecnica intencional: ...
