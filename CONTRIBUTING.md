# Contributing (NetSentinel 3D)

## Regla principal: PR con revision
Este repositorio se mantiene mediante Pull Requests con revision de un senior.

Politica:
- No hacer merge directo a ramas protegidas (`main`, `develop`, `release/**`).
- Todo cambio debe pasar por PR con CI en verde.
- Los cambios sensibles (seguridad, comandos Tauri, infraestructura de red) requieren revision explicita.

## Agentes IA
Los agentes IA:
- pueden preparar cambios en una rama de feature,
- pueden ejecutar tests/local checks,
- no deben crear commits finales sin confirmacion del desarrollador/senior responsable.

Motivo:
- reduce riesgo de regressiones,
- mejora trazabilidad y control de cambios.

## Checklist minimo
- `npm test -- --run`
- `npm run build`
- `cargo check --tests` (si hubo cambios en Rust)
- `docs/CHANGELOG.md` actualizado (si aplica)

## Reglas de frontend (rendimiento y trazas)
- Componentes pesados (3D, paneles de auditoria) deben cargarse con `React.lazy` + `Suspense`.
- En `vite.config.ts`, mantener `manualChunks` para separar `three`, `@react-three/*` y `react`.
- Evitar logs de debug permanentes en produccion:
  - usar `uiLogger` (`src/ui/utils/logger.ts`),
  - si se necesita depuracion 3D, activar `localStorage.setItem("netsentinel.debug3d", "true")` solo en desarrollo.
