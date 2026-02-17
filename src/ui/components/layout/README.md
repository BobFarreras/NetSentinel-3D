<!-- Ruta: src/ui/components/layout/README.md -->
<!-- Descripcion: capa de layout compartida. Orquesta TopBar, docking/undocking y render de paneles principales (Radar/AttackLab/Settings/Console). -->

# Layout (UI compartida)

Esta carpeta contiene la infraestructura de UI para componer la aplicacion:
- Top bar (controles globales + controles de ventana en Tauri).
- Docking/undocking (paneles acoplados y ventanas desacopladas).
- Composicion del layout principal (izquierda: paneles; derecha: escena 3D + detalle de dispositivo).

## Interconexiones

Entradas:
- Estado de app desde `src/App.tsx` (devices, seleccion, flags de paneles, identidad).
- Bridge Tauri via adapters: `src/adapters/windowingAdapter.ts`.

Salidas:
- Eventos/handlers que abren/cerran paneles y desacoplan ventanas (`DetachedPanelView` / `DetachedWindowPortal`).
- Propaga callbacks hacia features (Radar/AttackLab/Settings/Console/Scene3D).

## Archivos clave

- `src/ui/components/layout/MainDockedLayout.tsx`: layout principal acoplado.
- `src/ui/components/layout/TopBar.tsx`: barra superior y acciones globales.
- `src/ui/components/layout/DetachedPanelView.tsx`: contenedor estandar para paneles desacoplados.
- `src/ui/components/layout/DetachedWindowPortal.tsx`: portal para render en ventana separada.

Subcarpetas:
- `src/ui/components/layout/main_docked/`: secciones del layout acoplado (areas izquierda/derecha, paneles desacoplables).
- `src/ui/components/layout/topbar/`: estado, estilos e iconos del TopBar.

