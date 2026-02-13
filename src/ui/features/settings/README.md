<!-- src/ui/features/settings/README.md -->
Descripcion: Feature de Settings (UX). Centraliza configuracion del operador (idioma) y un "Field Manual" didactico
para entender colores/estados de la escena 3D sin salir del programa.

## Contenido
- `components/SettingsPanel.tsx`: UI del panel (presentacion). Sin logica de persistencia directa.
- `hooks/useSettingsPanelState.ts`: estado del panel (tabs + selector de idioma via i18n provider).
- `components/field_manual/*`: "Field Manual" jugable (leyenda 3D + docs por seccion).
- `field_manual/*`: contenido didactico (alto nivel) para escenarios.

## i18n
- El idioma se gestiona via `src/ui/i18n/*` y se persiste en backend settings (Tauri command `set_ui_language`).
- Fallback: si no hay backend (web dev/tests), se usa `localStorage` (`netsentinel.uiLanguage`).
