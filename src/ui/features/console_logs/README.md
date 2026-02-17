<!-- Ruta: src/ui/features/console_logs/README.md -->
<!-- Descripcion: feature Console Logs. Consola unificada (SYSTEM/TRAFFIC/RADAR) que agrega logs y monta sub-paneles especializados. -->

# Console Logs (UI)

Consola de telemetria de la app: unifica tres pestañas con responsabilidades separadas.

- SYSTEM: logs locales/diagnostico (inyectados por el layout o logger UI).
- TRAFFIC: integra `TrafficPanel` y controla start/stop sniffing.
- RADAR: integra logs del Radar (resultados de `scan_airwaves` y errores).

## Interconexiones

Entradas:
- Montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx` (y/o vista detached si aplica).

Dependencias internas:
- Estado: `src/ui/features/console_logs/hooks/useConsoleLogsState.ts`
- Traffic: `src/ui/features/traffic/hooks/useTrafficMonitor.ts`
- Radar logs: `src/ui/features/radar/hooks/useRadarLogs.ts`
- Seleccion de radar: `src/ui/features/radar/hooks/useWifiRadarSelection.ts`

Salidas:
- Controla `TrafficPanel`: `src/ui/features/traffic/components/TrafficPanel.tsx`
- Renderiza vistas: `src/ui/features/console_logs/components/RadarLogsView.tsx`, `src/ui/features/console_logs/components/SystemLogsView.tsx`

## Tests

- UI: `src/ui/features/console_logs/__tests__/ConsoleLogs.test.tsx`
- Hook: `src/ui/features/console_logs/__tests__/useConsoleLogsState.test.ts`

