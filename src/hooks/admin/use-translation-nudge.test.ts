import { act, renderHook } from "@testing-library/react";

import { useTranslationNudge } from "./use-translation-nudge";

describe("useTranslationNudge", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("does not nudge when other locales are empty", () => {
    const { result } = renderHook(() => useTranslationNudge("header_degree"));

    act(() => {
      result.current.triggerNudge({
        storageKey: "header_degree",
        fieldLabel: "Degree",
        editedLocale: "es",
        editedValue: "Matemáticas",
        otherLocaleValues: {
          en: { label: "English", flag: "🇬🇧", value: "   " },
        },
      });
    });

    expect(result.current.nudge).toBeNull();
  });

  it("persists a nudge and dismisses it after locales are done or skipped", () => {
    const { result } = renderHook(() => useTranslationNudge("header_degree"));

    act(() => {
      result.current.triggerNudge({
        storageKey: "header_degree",
        fieldLabel: "Degree",
        editedLocale: "es",
        editedValue: "Matemáticas",
        otherLocaleValues: {
          en: { label: "English", flag: "🇬🇧", value: "Math" },
          nl: { label: "Dutch", flag: "🇳🇱", value: "Wiskunde" },
        },
      });
    });

    expect(result.current.nudge?.pendingLocales).toHaveLength(2);
    expect(sessionStorage.getItem("translation_nudge_header_degree")).toContain(
      "Degree",
    );

    act(() => {
      result.current.markDone("en");
    });
    expect(
      result.current.nudge?.pendingLocales.find((p) => p.locale === "en")
        ?.status,
    ).toBe("done");

    act(() => {
      result.current.markSkipped("nl");
    });
    expect(result.current.nudge).toBeNull();
    expect(
      sessionStorage.getItem("translation_nudge_header_degree"),
    ).toBeNull();
  });

  it("dismisses the current nudge", () => {
    const { result } = renderHook(() => useTranslationNudge("header_degree"));

    act(() => {
      result.current.triggerNudge({
        storageKey: "header_degree",
        fieldLabel: "Degree",
        editedLocale: "es",
        editedValue: "Matemáticas",
        otherLocaleValues: {
          en: { label: "English", flag: "🇬🇧", value: "Math" },
        },
      });
      result.current.dismiss();
    });

    expect(result.current.nudge).toBeNull();
  });
});
