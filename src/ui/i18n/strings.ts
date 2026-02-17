// src/ui/i18n/strings.ts
// Descripcion: registro de traducciones (CA/ES/EN) y exports de i18n (keys + tablas). Compatible con imports existentes.

import type { UILanguage } from "../../shared/dtos/SettingsDTOs";
import type { I18nKey } from "./keys";
import { ES_STRINGS } from "./locales/es";
import { CA_STRINGS } from "./locales/ca";
import { EN_STRINGS } from "./locales/en";

type Dict = Record<I18nKey, string>;

export const STRINGS: Record<UILanguage, Dict> = {
  es: ES_STRINGS,
  ca: CA_STRINGS,
  en: EN_STRINGS,
};

export type { I18nKey } from "./keys";

export const DEFAULT_LANGUAGE: UILanguage = "es";

