// src/ui/components/layout/main_docked/useMainDockedLayoutTitles.ts
// Hook de textos/titulos del layout acoplado: centraliza traducciones para evitar ruido en MainDockedLayout.

import { useI18n } from "../../../i18n";

export const useMainDockedLayoutTitles = () => {
  const { t } = useI18n();

  return {
    t,
    undockTitle: t("common.undockPanel"),
    closeTitle: t("common.closePanel"),
    dockTitle: t("common.dockPanel"),
    detachedConsoleTitle: t("layout.detached.consoleTitle"),
    detachedDeviceTitlePrefix: t("layout.detached.deviceTitlePrefix"),
    detachedRadarTitle: t("layout.detached.radarTitle"),
    detachedAttackLabTitle: t("layout.detached.attackLabTitle"),
    detachedSceneTitle: t("layout.detached.sceneTitle"),
    detachedSettingsTitle: t("layout.detached.settingsTitle"),
  };
};

