<!-- Ruta: src/ui/features/scene3d/README.md -->
<!-- Descripcion: feature Scene3D. Componentes y hooks para render 3D (NetworkScene/Node/Label) y estado asociado (orbitas, labels, seleccion). -->

# Scene3D (UI)

Escena 3D principal (Three/R3F) para visualizar dispositivos como nodos y habilitar seleccion. Mantiene la logica de layout 3D fuera de los componentes de UI 2D.

## Interconexiones

Entradas:
- Montado desde layout: `src/ui/components/layout/MainDockedLayout.tsx` y `src/ui/components/layout/DetachedPanelView.tsx`.
- Props tipicas: `devices`, `selectedIp`, `intruders`, `identity`, `onDeviceSelect`.

Salidas:
- `onDeviceSelect`: actualiza seleccion en el layout, que a su vez abre/actualiza `src/ui/features/device_detail/components/DeviceDetailPanel.tsx`.

Componentes/hook principales:
- UI 3D: `src/ui/features/scene3d/components/NetworkScene.tsx`, `NetworkNode.tsx`, `NodeLabel.tsx`
- Estado: `src/ui/features/scene3d/hooks/useNetworkSceneState.ts`, `useNetworkNodeState.ts`, `useNodeLabelState.ts`

## Tests

- Hooks: `src/ui/features/scene3d/__tests__/useNetworkSceneState.test.ts`, `useNetworkNodeState.test.ts`, `useNodeLabelState.test.ts`

