import { act, renderHook } from "@testing-library/react";

import useLocalStorage from "./use-local-storage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads the initial value when the key is empty", () => {
    const { result } = renderHook(() => useLocalStorage("theme", "dark"));
    expect(result.current[0]).toBe("dark");
  });

  it("persists updates and reads them back", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));

    act(() => {
      result.current[1](2);
    });
    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem("count")).toBe("2");

    act(() => {
      result.current[1]((value) => value + 1);
    });
    expect(result.current[0]).toBe(3);
  });

  it("hydrates from existing JSON", () => {
    window.localStorage.setItem("flag", JSON.stringify(true));
    const { result } = renderHook(() => useLocalStorage("flag", false));
    expect(result.current[0]).toBe(true);
  });

  it("falls back when stored JSON is invalid", () => {
    const spy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    window.localStorage.setItem("bad", "{");
    const { result } = renderHook(() => useLocalStorage("bad", "ok"));
    expect(result.current[0]).toBe("ok");
    spy.mockRestore();
  });
});
