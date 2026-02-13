<!-- Ruta: src/ui/features/history/README.md -->
<!-- Descripcion: feature History. Panel para listar sesiones guardadas (persistencia) y cargar snapshots de dispositivos hacia la app. -->

# History (UI)

Panel de historial de sesiones: consulta el backend para listar sesiones (`ScanSession`) y permite cargar un snapshot de `DeviceDTO[]` en el estado principal.

## Interconexiones

Entradas:
- Montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx`.
- Callback `onLoadSession(devices)`: el layout aplica esos dispositivos al estado principal (pintado de escena/seleccion).

IPC:
- Adapter: `src/adapters/networkAdapter.ts`
- Comando Tauri: `get_history`
- DTOs: `src/shared/dtos/NetworkDTOs.ts` (tipos `ScanSession`, `DeviceDTO`)

Componente principal:
- `src/ui/features/history/components/HistoryPanel.tsx`

