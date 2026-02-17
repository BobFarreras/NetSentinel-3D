<!-- Ruta: src/ui/features/device_detail/README.md -->
<!-- Descripcion: feature Device Detail. Panel HUD para inspeccionar un dispositivo seleccionado, ejecutar auditoria y abrir Attack Lab con el target. -->

# Device Detail (UI)

Panel de detalles del dispositivo seleccionado en la escena: muestra datos derivados (nombre, MAC, seccion WiFi) y expone acciones:

- Auditoria de router/target (segun integracion del layout).
- Apertura de Attack Lab con el dispositivo como objetivo.
- Carga de identidad del host para contextualizar (quien soy yo en la red).

## Interconexiones

Entradas:
- Seleccion de nodo desde escena 3D: `src/ui/features/scene3d/components/NetworkScene.tsx` (via layout).
- Panel montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx`.

IPC:
- Comando Tauri: `get_identity` (actualmente via `invoke` directo en el hook).
- DTOs: `src/shared/dtos/NetworkDTOs.ts` (tipos `DeviceDTO`, `HostIdentity`)

Salidas:
- `onRouterAudit(ip)`: el layout decide si invoca `audit_router`/`audit_target` via `src/adapters/auditAdapter.ts`.
- `onOpenLabAudit(device)`: abre Attack Lab (feature `src/ui/features/attack_lab/`).

Componentes/hook principales:
- UI: `src/ui/features/device_detail/components/DeviceDetailPanel.tsx`
- Estado: `src/ui/features/device_detail/hooks/useDeviceDetailPanelState.ts`

## Tests

- UI: `src/ui/features/device_detail/__tests__/DeviceDetailPanel.test.tsx`
- Hook: `src/ui/features/device_detail/__tests__/useDeviceDetailPanelState.test.ts`

