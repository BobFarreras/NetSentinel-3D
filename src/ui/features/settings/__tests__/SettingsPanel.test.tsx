// src/ui/features/settings/__tests__/SettingsPanel.test.tsx
// Tests del panel Settings: renderiza tabs y leyenda visual (sin depender de Tauri).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "../../../i18n/I18nProvider";
import { SettingsPanel } from "../components/SettingsPanel";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

vi.mock("../../../../adapters/settingsAdapter", () => ({
  settingsAdapter: {
    getAppSettings: vi.fn().mockResolvedValue({ uiLanguage: "es" }),
    setUiLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../components/field_manual/FieldManualView", () => ({
  FieldManualView: () => <div>FIELD_MANUAL_MOCK</div>,
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
    expect(await screen.findByText("FIELD_MANUAL_MOCK")).toBeInTheDocument();
  });

  it("debe abrir Password Vault desde Settings", async () => {
    invokeMock.mockResolvedValueOnce([]); // get_dictionary

    render(
      <I18nProvider>
        <SettingsPanel onClose={() => {}} />
      </I18nProvider>
    );

    expect(await screen.findByLabelText("SETTINGS_PANEL")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "SETTINGS_OPEN_PASSWORDS" }));
    expect(await screen.findByText("PASSWORDS // VAULT")).toBeInTheDocument();
  });
});
