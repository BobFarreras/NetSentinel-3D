// src/ui/i18n/useI18n.ts
// Descripcion: hook de consumo de i18n. Exige estar bajo `I18nProvider`.

import { useContext } from "react";
import { I18nContext } from "./I18nProvider";

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  }
  return ctx;
}

