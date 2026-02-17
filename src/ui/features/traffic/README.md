<!-- Ruta: src/ui/features/traffic/README.md -->
<!-- Descripcion: feature Traffic. UI y hooks para arrancar/parar sniffing en backend, consumir eventos streaming y aplicar filtros/paginacion. -->

# Traffic (UI)

Panel de monitorizacion de trafico en vivo: arranca/detiene sniffing, escucha paquetes por eventos Tauri y expone filtros (ALL/JAMMED/TARGET) para la UI.

## Interconexiones

Entradas:
- Panel embebido en Console Logs: `src/ui/features/console_logs/components/ConsoleLogs.tsx`.

IPC:
- Comandos Tauri: `start_traffic_sniffing`, `stop_traffic_sniffing`
- Evento Tauri: `traffic-event`
- Bridge: `src/shared/tauri/bridge.ts` (invoke + listen)
- DTOs: `src/shared/dtos/NetworkDTOs.ts` (tipo `TrafficPacket`)

Componentes/hook principales:
- UI: `src/ui/features/traffic/components/TrafficPanel.tsx`
- Estado/filtros: `src/ui/features/traffic/hooks/useTrafficPanelState.ts`
- Streaming/buffers: `src/ui/features/traffic/hooks/useTrafficMonitor.ts`

## Tests

- UI: `src/ui/features/traffic/__tests__/TrafficPanel.test.tsx`
- Hooks: `src/ui/features/traffic/__tests__/useTrafficMonitor.test.ts`, `src/ui/features/traffic/__tests__/useTrafficPanelState.test.ts`

