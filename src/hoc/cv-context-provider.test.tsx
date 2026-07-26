import { renderHook, act } from "@testing-library/react";
import React from "react";
import { CvContextProvider, useCvContext } from "./cv-context-provider";

// next-intl is mocked globally in src/test-utils/setup.ts
// useLocale() returns "en" by default from the mock

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CvContextProvider>{children}</CvContextProvider>
);

describe("CvContextProvider + useCvContext", () => {
  it("provides default state values", () => {
    const { result } = renderHook(() => useCvContext(), { wrapper });

    expect(result.current.showSectionIcons).toBe(false);
    expect(result.current.addSplashOfColor).toBe(false);
    expect(result.current.showVisualizations).toBe(false);
    // Headshot depends on locale: mocked locale is "en", so showHeadshot = false
    expect(result.current.showHeadshot).toBe(false);
  });

  it("toggles showSectionIcons", () => {
    const { result } = renderHook(() => useCvContext(), { wrapper });

    act(() => {
      result.current.toggleSectionIcons();
    });
    expect(result.current.showSectionIcons).toBe(true);

    act(() => {
      result.current.toggleSectionIcons();
    });
    expect(result.current.showSectionIcons).toBe(false);
  });

  it("toggles addSplashOfColor", () => {
    const { result } = renderHook(() => useCvContext(), { wrapper });

    act(() => {
      result.current.toggleSplashOfColor();
    });
    expect(result.current.addSplashOfColor).toBe(true);

    act(() => {
      result.current.toggleSplashOfColor();
    });
    expect(result.current.addSplashOfColor).toBe(false);
  });

  it("toggles showHeadshot", () => {
    const { result } = renderHook(() => useCvContext(), { wrapper });

    act(() => {
      result.current.toggleHeadshot();
    });
    expect(result.current.showHeadshot).toBe(true);

    act(() => {
      result.current.toggleHeadshot();
    });
    expect(result.current.showHeadshot).toBe(false);
  });

  it("toggles showVisualizations", () => {
    const { result } = renderHook(() => useCvContext(), { wrapper });

    act(() => {
      result.current.toggleVisualizations();
    });
    expect(result.current.showVisualizations).toBe(true);

    act(() => {
      result.current.toggleVisualizations();
    });
    expect(result.current.showVisualizations).toBe(false);
  });

  it("throws when useCvContext is used outside CvContextProvider", () => {
    // Suppress React error boundary output
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => {
      renderHook(() => useCvContext());
    }).toThrow("useCvContext must be used within a CvProvider");
    spy.mockRestore();
  });
});
