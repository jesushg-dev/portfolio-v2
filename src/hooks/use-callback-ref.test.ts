import { renderHook } from "@testing-library/react";
import { useCallbackRef } from "./use-callback-ref";

describe("useCallbackRef", () => {
  it("returns a stable function reference across re-renders", () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useCallbackRef(cb),
      { initialProps: { cb: fn1 } }
    );

    const ref1 = result.current;
    ref1();
    expect(fn1).toHaveBeenCalledTimes(1);

    rerender({ cb: fn2 });
    const ref2 = result.current;

    expect(ref1).toBe(ref2); // reference is stable

    ref2();
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn1).toHaveBeenCalledTimes(1);
  });

  it("handles undefined callback gracefully", () => {
    const { result } = renderHook(() => useCallbackRef(undefined));
    expect(() => result.current()).not.toThrow();
  });
});
