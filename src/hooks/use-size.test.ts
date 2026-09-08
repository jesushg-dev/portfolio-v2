import { renderHook } from "@testing-library/react";
import { createRef } from "react";

import useSize from "./use-size";

describe("useSize", () => {
  it("reads offsetWidth/offsetHeight from the element", () => {
    const node = document.createElement("div");
    Object.defineProperty(node, "offsetWidth", { value: 120 });
    Object.defineProperty(node, "offsetHeight", { value: 80 });
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: node, writable: true });

    const { result } = renderHook(() => useSize(ref));
    expect(result.current).toEqual({ width: 120, height: 80 });
  });

  it("falls back to the window when the ref is empty", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 768,
    });
    const ref = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useSize(ref));
    expect(result.current).toEqual({ width: 1024, height: 768 });
  });
});
