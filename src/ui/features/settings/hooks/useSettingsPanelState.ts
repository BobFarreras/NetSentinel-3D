// src/ui/features/settings/hooks/useSettingsPanelState.ts
// Descripcion: estado del SettingsPanel. Gestiona tabs y el selector de idioma a traves del provider de i18n.

import { useMemo, useState } from "react";
import type { UILanguage } from "../../../../shared/dtos/SettingsDTOs";
import { useI18n } from "../../../i18n";

export type SettingsTab = "general" | "field_manual";

type UseSettingsPanelState = {
  tab: SettingsTab;
  setTab: (tab: SettingsTab) => void;
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  languageOptions: Array<{ value: UILanguage; label: string }>;
};

export function useSettingsPanelState(): UseSettingsPanelState {
  const { language, setLanguage } = useI18n();
  const [tab, setTab] = useState<SettingsTab>("general");

  const languageOptions = useMemo(
    () => [
      { value: "es" as const, label: "Castellano (ES)" },
      { value: "ca" as const, label: "Catalan (CA)" },
      { value: "en" as const, label: "English (EN)" },
    ],
    []
  );

  return {
    tab,
    setTab,
    language,
    setLanguage,
    languageOptions,
  };
}

