// src/ui/i18n/I18nProvider.tsx
// Descripcion: provider global de i18n. Carga idioma desde backend settings y expone `t(key)` + `setLanguage`.

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const I18N_SYNC_EVENT = "netsentinel:i18n-changed";
const I18N_SYNC_CHANNEL = "netsentinel-i18n";

function coerceLanguage(raw: unknown): UILanguage | null {
  if (raw === "es" || raw === "ca" || raw === "en") return raw;
  return null;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
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

    const onStorage = (evt: StorageEvent) => {
      if (evt.key !== STORAGE_KEY) return;
      const lang = coerceLanguage(evt.newValue);
      if (lang) setLanguageState(lang);
    };

    const onLocalSync = (evt: Event) => {
      const customEvt = evt as CustomEvent<UILanguage>;
      const lang = coerceLanguage(customEvt.detail);
      if (lang) setLanguageState(lang);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(I18N_SYNC_EVENT, onLocalSync as EventListener);

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(I18N_SYNC_CHANNEL);
      channel.onmessage = (evt: MessageEvent<unknown>) => {
        const lang = coerceLanguage(evt.data);
        if (lang) setLanguageState(lang);
      };
      channelRef.current = channel;
    }

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
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(I18N_SYNC_EVENT, onLocalSync as EventListener);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, []);

  const setLanguage = useCallback((lang: UILanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }

    // Sincroniza cambio entre paneles desacoplados/ventanas.
    window.dispatchEvent(new CustomEvent<UILanguage>(I18N_SYNC_EVENT, { detail: lang }));
    channelRef.current?.postMessage(lang);

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
