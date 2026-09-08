import { renderHook, act } from "@testing-library/react";

import useBoolean from "./use-boolean";

describe("useBoolean", () => {
  it("starts from the given initial value", () => {
    const { result } = renderHook(() => useBoolean(true));
    expect(result.current[0]).toBe(true);
  });

  it("toggles, sets, and resets", () => {
    const { result } = renderHook(() => useBoolean());
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].on();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].set(true);
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].off();
    });
    expect(result.current[0]).toBe(false);
  });
});
