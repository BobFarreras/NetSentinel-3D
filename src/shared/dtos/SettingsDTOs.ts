// src/shared/dtos/SettingsDTOs.ts
// Descripcion: contratos TS para settings persistidos por el backend (idioma UI, flags de UX).

export type UILanguage = "es" | "ca" | "en";

export interface AppSettingsDTO {
  // Nota: backend usa camelCase por serde.
  realMacAddress?: string | null;
  uiLanguage?: UILanguage | null;
}

