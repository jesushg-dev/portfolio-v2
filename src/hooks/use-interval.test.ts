import { renderHook, act } from "@testing-library/react";
import useInterval from "./use-interval";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useInterval", () => {
  it("calls the callback at the given interval when delay is a number", () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 100));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("does not start an interval when delay is null", () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, null));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("clears the interval on unmount", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 200));

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("uses the latest callback without restarting the interval", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 100), {
      initialProps: { cb: first },
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ cb: second });

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
