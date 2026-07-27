import { renderHook } from "@testing-library/react";
import { useTabsKeyboard } from "./use-tabs-keyboard";

function makeKeyEvent(key: string): {
  event: React.KeyboardEvent<HTMLElement>;
  preventDefault: jest.Mock;
} {
  const preventDefault = jest.fn();
  const event = {
    key,
    preventDefault,
  } as unknown as React.KeyboardEvent<HTMLElement>;
  return { event, preventDefault };
}

describe("useTabsKeyboard", () => {
  it("calls onChange with the previous index on ArrowLeft", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(3, 1, onChange));
    const { event, preventDefault } = makeKeyEvent("ArrowLeft");
    result.current(event);
    expect(onChange).toHaveBeenCalledWith(0);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("wraps around to the last tab when pressing ArrowLeft on the first tab", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(3, 0, onChange));
    result.current(makeKeyEvent("ArrowLeft").event);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with the next index on ArrowRight", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(3, 1, onChange));
    result.current(makeKeyEvent("ArrowRight").event);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("wraps around to the first tab when pressing ArrowRight on the last tab", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(3, 2, onChange));
    result.current(makeKeyEvent("ArrowRight").event);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("calls onChange with the previous index on ArrowUp", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(4, 2, onChange));
    result.current(makeKeyEvent("ArrowUp").event);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("calls onChange with the next index on ArrowDown", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(4, 2, onChange));
    result.current(makeKeyEvent("ArrowDown").event);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("calls onChange with 0 on Home", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(5, 3, onChange));
    result.current(makeKeyEvent("Home").event);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("calls onChange with last index on End", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(5, 0, onChange));
    result.current(makeKeyEvent("End").event);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("does nothing for unrelated keys", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(3, 0, onChange));
    const { event, preventDefault } = makeKeyEvent("Tab");
    result.current(event);
    expect(onChange).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does nothing when tabCount is 0", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTabsKeyboard(0, 0, onChange));
    result.current(makeKeyEvent("ArrowRight").event);
    expect(onChange).not.toHaveBeenCalled();
  });
});
