import { renderHook, act } from "@testing-library/react";
import type { PanInfo } from "motion/react";

import { useDragToClose } from "./use-drag-to-close";

function createPanInfo(overrides: Partial<PanInfo> = {}): PanInfo {
  return {
    point: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    ...overrides,
  };
}

describe("useDragToClose", () => {
  it("closes when drag offset exceeds the threshold", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useDragToClose(onClose, true));

    act(() => {
      result.current.dragProps.onDragEnd(
        {} as PointerEvent,
        createPanInfo({ offset: { x: 0, y: 80 } }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.y.get()).toBe(0);
  });

  it("closes when flick velocity exceeds the threshold", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useDragToClose(onClose, true));

    act(() => {
      result.current.dragProps.onDragEnd(
        {} as PointerEvent,
        createPanInfo({ velocity: { x: 0, y: 500 } }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("resets drag position after a short drag", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useDragToClose(onClose, true));

    act(() => {
      result.current.y.set(24);
      result.current.dragProps.onDragEnd(
        {} as PointerEvent,
        createPanInfo({ offset: { x: 0, y: 12 } }),
      );
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.y.get()).toBe(0);
  });

  it("exposes vertical drag constraints", () => {
    const { result } = renderHook(() => useDragToClose(jest.fn(), true));

    expect(result.current.dragProps).toMatchObject({
      drag: "y",
      dragConstraints: { top: 0, bottom: 0 },
      dragMomentum: false,
    });
  });
});
