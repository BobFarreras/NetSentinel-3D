# docs/UI_SETTINGS.md
Descripcion: especificacion tecnica del panel de Settings (UI) e infraestructura i18n (CA/ES/EN).

## Objetivo
1. Permitir al operador configurar el idioma sin tocar codigo.
2. Mantener una "plantilla de ensenanza" dentro del programa:
   - leyenda visual de colores/estados de nodos
   - documentacion de referencia (paths) para navegar rapido el repo

## i18n (arquitectura)
- Provider: `src/ui/i18n/I18nProvider.tsx`
- Hook: `src/ui/i18n/useI18n.ts`
- Diccionario: `src/ui/i18n/strings.ts`

### Persistencia
- Primary: backend settings via Tauri:
  - `get_app_settings`
  - `set_ui_language`
  - `save_app_settings` (completo)
- Fallback: `localStorage` key `netsentinel.uiLanguage` para web dev/tests.

### Como anadir una nueva traduccion
1. Anadir una key a `I18nKey` en `src/ui/i18n/strings.ts`.
2. Rellenar ES/CA/EN en `STRINGS`.
3. Usar `const { t } = useI18n();` y `t("mi.key")` en UI.

## SettingsPanel
- Feature: `src/ui/features/settings`
- Panel: `src/ui/features/settings/components/SettingsPanel.tsx`
- Estado: `src/ui/features/settings/hooks/useSettingsPanelState.ts`
- Field Manual (in-app docs): `src/ui/features/settings/components/field_manual/FieldManualView.tsx`
- Leyenda 3D (jugable): `src/ui/features/settings/components/field_manual/LegendArena3D.tsx` (reusa `NetworkNode`)

### Field Manual (leyenda 3D)
La leyenda usa la misma paleta que la escena:
- Router centro: `#0088ff` (con ring `#004488`)
- Host: `#00ff00`
- Intruder: `#ff0000` (ring rojo)
- Wifi intel: `#ff00ff`
- Default: `#ff4444`
- Selected: `#ffd700`
- Hover: `#ffffff`

## Docking/Detach
- Settings se trata como panel desacoplable:
  - ID: `settings` en `src/adapters/windowingAdapter.ts`
  - Docking state: `src/ui/hooks/modules/ui/usePanelDockingState.ts`
  - Ventana detached: `src/ui/components/layout/DetachedPanelView.tsx` + `DetachedWindowPortal` en `MainDockedLayout`.

## Tests
- `src/ui/i18n/__tests__/i18n.test.ts`
- `src/ui/features/settings/__tests__/SettingsPanel.test.tsx`
