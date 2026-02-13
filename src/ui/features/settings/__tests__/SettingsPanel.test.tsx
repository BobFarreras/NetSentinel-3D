// src/ui/features/settings/__tests__/SettingsPanel.test.tsx
// Tests del panel Settings: renderiza tabs y leyenda visual (sin depender de Tauri).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "../../../i18n/I18nProvider";
import { SettingsPanel } from "../components/SettingsPanel";

vi.mock("../../../../adapters/settingsAdapter", () => ({
  settingsAdapter: {
    getAppSettings: vi.fn().mockResolvedValue({ uiLanguage: "es" }),
    setUiLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("SettingsPanel", () => {
  it("debe renderizar y permitir cambiar a Field Manual", async () => {
    render(
      <I18nProvider>
        <SettingsPanel onClose={() => {}} />
      </I18nProvider>
    );

    expect(await screen.findByLabelText("SETTINGS_PANEL")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "SETTINGS_TAB_FIELD_MANUAL" }));
    expect(await screen.findByText(/Leyenda 3D/i)).toBeInTheDocument();
    // Navegacion interna del manual
    expect(screen.getByRole("button", { name: "MANUAL_SECTION_ATTACK_LAB" })).toBeInTheDocument();
  });
});
