<!-- src/ui/features/settings/README.md -->
Descripcion: Feature de Settings (UX). Centraliza configuracion del operador (idioma) y un "Field Manual" didactico
para entender colores/estados de la escena 3D sin salir del programa.

## Contenido
- `components/SettingsPanel.tsx`: UI del panel (presentacion). Sin logica de persistencia directa.
- `hooks/useSettingsPanelState.ts`: estado del panel (tabs + selector de idioma via i18n provider).
- `components/field_manual/*`: "Field Manual" jugable (leyenda 3D + docs por seccion).
- `components/SettingsPanel.tsx` abre el `Password Vault` reutilizando `src/ui/features/attack_lab/panel/WordlistManagerModal.tsx`.
- `field_manual/*`: contenido didactico (alto nivel) para escenarios.

## i18n
- El idioma se gestiona via `src/ui/i18n/*` y se persiste en backend settings (Tauri command `set_ui_language`).
- Fallback: si no hay backend (web dev/tests), se usa `localStorage` (`netsentinel.uiLanguage`).

## Gateway credentials
- Las credenciales del gateway se almacenan en Keyring del SO via comandos Tauri:
  - `save_gateway_credentials`, `get_gateway_credentials`, `delete_gateway_credentials`
- Se usan para login directo en auditorias/sync del router, evitando repetir prompts.
