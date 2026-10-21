import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";

import { useClickAway } from "./use-click-away";

describe("useClickAway", () => {
  it("calls the handler when the event is outside the element", () => {
    const handler = jest.fn();
    const inside = document.createElement("div");
    document.body.append(inside);
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: inside, writable: true });

    renderHook(() => useClickAway(ref, handler));

    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });
    expect(handler).toHaveBeenCalledTimes(1);

    act(() => {
      inside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    inside.remove();
  });
});
