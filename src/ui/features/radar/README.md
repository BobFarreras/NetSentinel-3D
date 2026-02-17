<!-- Ruta: src/ui/features/radar/README.md -->
<!-- Descripcion: feature Radar (WiFi Spectrum). Coordina escaneo pasivo de redes WiFi, filtros/seleccion y accion de abrir Attack Lab con contexto. -->

# Radar (UI)

Radar View para reconocimiento pasivo (WiFi Spectrum): ejecuta escaneo de airwaves, normaliza redes para la UI, aplica filtros y mantiene seleccion.

## Interconexiones

Entradas:
- Panel montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx` y `src/ui/components/layout/DetachedPanelView.tsx`.

IPC:
- Adapter: `src/adapters/wifiAdapter.ts`
- Comando Tauri: `scan_airwaves`
- DTOs: `src/shared/dtos/NetworkDTOs.ts` (tipo `WifiNetworkDTO`)

Salidas:
- Logs consumidos por Console Logs: `src/ui/features/console_logs/hooks/useConsoleLogsState.ts` (tab RADAR) via `src/ui/features/radar/hooks/useRadarLogs.ts`.
- Accion “abrir Attack Lab con contexto”: `src/ui/features/radar/components/radar/RadarIntelPanel.tsx` (pasa `scenarioId` + target sintetizado).

Componentes/hook principales:
- UI: `src/ui/features/radar/components/RadarPanel.tsx`
- Estado: `src/ui/features/radar/hooks/useRadarPanelState.ts`
- Escaneo: `src/ui/features/radar/hooks/useWifiRadar.ts`
- Seleccion: `src/ui/features/radar/hooks/useWifiRadarSelection.ts`
- Gate legal: `src/ui/features/radar/components/radar/RadarLegalModal.tsx`

## Tests

- UI: `src/ui/features/radar/__tests__/RadarPanel.test.tsx`
- Hooks: `src/ui/features/radar/__tests__/useRadarLogs.test.ts`, `src/ui/features/radar/__tests__/useWifiRadar.test.ts`

