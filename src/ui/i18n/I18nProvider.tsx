// src/ui/i18n/I18nProvider.tsx
// Descripcion: provider global de i18n. Carga idioma desde backend settings y expone `t(key)` + `setLanguage`.

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { UILanguage } from "../../shared/dtos/SettingsDTOs";
import { settingsAdapter } from "../../adapters/settingsAdapter";
import { DEFAULT_LANGUAGE, STRINGS, type I18nKey } from "./strings";

type I18nContextValue = {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  t: (key: I18nKey) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "netsentinel.uiLanguage";

function coerceLanguage(raw: unknown): UILanguage | null {
  if (raw === "es" || raw === "ca" || raw === "en") return raw;
  return null;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<UILanguage>(() => {
    try {
      const fromStorage = coerceLanguage(localStorage.getItem(STORAGE_KEY));
      return fromStorage ?? DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  // Bootstrap: backend settings -> sincroniza idioma real persistido.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await settingsAdapter.getAppSettings();
        const lang = coerceLanguage(settings.uiLanguage ?? null);
        if (!cancelled && lang) {
          setLanguageState(lang);
          try {
            localStorage.setItem(STORAGE_KEY, lang);
          } catch {
            // ignore
          }
        }
      } catch {
        // En dev/web o tests puede no existir Tauri: usamos fallback localStorage/default.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((lang: UILanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    // Persistimos en backend sin bloquear UI.
    void settingsAdapter.setUiLanguage(lang).catch(() => {
      // ignore: si backend no disponible (web dev), ya persistimos en localStorage.
    });
  }, []);

  const t = useCallback(
    (key: I18nKey): string => {
      const table = STRINGS[language] ?? STRINGS[DEFAULT_LANGUAGE];
      return table[key] ?? STRINGS[DEFAULT_LANGUAGE][key] ?? key;
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

