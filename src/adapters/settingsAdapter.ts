// src/adapters/settingsAdapter.ts
// Descripcion: adaptador IPC (Tauri invoke) para leer/escribir settings persistidos en backend.

import { invokeCommand } from "../shared/tauri/bridge";
import type { AppSettingsDTO, UILanguage } from "../shared/dtos/SettingsDTOs";

export const settingsAdapter = {
  getAppSettings: async (): Promise<AppSettingsDTO> => {
    return await invokeCommand<AppSettingsDTO>("get_app_settings");
  },

  saveAppSettings: async (settings: AppSettingsDTO): Promise<void> => {
    await invokeCommand("save_app_settings", { settings });
  },

  setUiLanguage: async (uiLanguage: UILanguage | null): Promise<void> => {
    await invokeCommand("set_ui_language", { uiLanguage });
  },
};

