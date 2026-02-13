// src/ui/i18n/__tests__/i18n.test.ts
// Tests del provider i18n: traducciones basicas y persistencia (localStorage + adapter backend mockeado).

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { I18nProvider } from "../I18nProvider";
import { useI18n } from "../useI18n";

vi.mock("../../../adapters/settingsAdapter", () => ({
  settingsAdapter: {
    getAppSettings: vi.fn(),
    setUiLanguage: vi.fn(),
  },
}));

import { settingsAdapter } from "../../../adapters/settingsAdapter";

describe("i18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem("netsentinel.uiLanguage");
  });

  it("debe traducir keys con fallback por defecto", async () => {
    (settingsAdapter.getAppSettings as any).mockResolvedValue({ uiLanguage: null });
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(I18nProvider, null, children);

    const { result } = renderHook(() => useI18n(), { wrapper });
    await waitFor(() => {
      expect(result.current.t("topbar.scan")).toBeTruthy();
    });
    expect(result.current.t("topbar.scan")).toBe("SCAN NET");
  });

  it("debe permitir cambiar idioma y persistir en localStorage + backend", async () => {
    (settingsAdapter.getAppSettings as any).mockResolvedValue({ uiLanguage: "es" });
    (settingsAdapter.setUiLanguage as any).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(I18nProvider, null, children);
    const { result } = renderHook(() => useI18n(), { wrapper });

    await waitFor(() => {
      expect(settingsAdapter.getAppSettings).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setLanguage("ca");
    });

    expect(localStorage.getItem("netsentinel.uiLanguage")).toBe("ca");
    expect(settingsAdapter.setUiLanguage).toHaveBeenCalledWith("ca");
    expect(result.current.t("topbar.history")).toBe("HISTORIAL");
  });
});
