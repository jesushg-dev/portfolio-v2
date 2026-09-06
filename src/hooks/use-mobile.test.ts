import { act, renderHook } from "@testing-library/react";

import { useIsMobile } from "./use-mobile";
import { useMediaQuery } from "./use-media-query";

describe("useIsMobile", () => {
  it("is true when the viewport is under 768px", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("is false on a desktop width", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});

describe("useMediaQuery", () => {
  it("reflects matchMedia.matches", () => {
    const listeners = new Set<() => void>();
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("print"),
      media: query,
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    }));

    const { result } = renderHook(() => useMediaQuery("print"));
    expect(result.current).toBe(true);
  });
});
