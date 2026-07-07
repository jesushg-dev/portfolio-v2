import { renderHook, fireEvent } from "@testing-library/react";
import { createRef } from "react";

import { useOutsideClick } from "./use-outside-click";

describe("useOutsideClick", () => {
  it("calls the callback when clicking outside the ref element", () => {
    const callback = jest.fn();
    const ref = createRef<HTMLDivElement>();
    const inside = document.createElement("div");
    const outside = document.createElement("div");

    ref.current = inside;
    document.body.append(inside, outside);

    renderHook(() => useOutsideClick(ref, callback));

    fireEvent.mouseDown(outside);
    expect(callback).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(inside);
    expect(callback).toHaveBeenCalledTimes(1);

    document.body.removeChild(inside);
    document.body.removeChild(outside);
  });

  it("supports touch events", () => {
    const callback = jest.fn();
    const ref = createRef<HTMLDivElement>();
    const outside = document.createElement("div");

    ref.current = document.createElement("div");
    document.body.append(ref.current, outside);

    renderHook(() => useOutsideClick(ref, callback));

    fireEvent.touchStart(outside);
    expect(callback).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref.current);
    document.body.removeChild(outside);
  });
});
