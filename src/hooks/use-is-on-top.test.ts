import { act, renderHook } from "@testing-library/react";

import useIsOnTop from "./use-is-on-top";

describe("useIsOnTop", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts true and becomes false after scrolling", () => {
    const { result } = renderHook(() => useIsOnTop());
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        writable: true,
        value: 40,
      });
      window.dispatchEvent(new Event("scroll"));
      jest.advanceTimersByTime(20);
    });

    expect(result.current).toBe(false);
  });
});
