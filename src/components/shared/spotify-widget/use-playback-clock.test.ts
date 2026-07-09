import { act, renderHook } from "@testing-library/react";

import { ETime } from "@/utils/constants/times";

import { usePlaybackClock } from "./use-playback-clock";

describe("usePlaybackClock", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("advances while playing", () => {
    const { result } = renderHook(() => usePlaybackClock(10_000, 60_000, true));

    expect(result.current).toBe(10_000);

    act(() => {
      jest.advanceTimersByTime(3 * ETime.SECOND);
    });

    expect(result.current).toBe(13_000);
  });

  it("resyncs when Spotify reports a new progressMs", () => {
    const { result, rerender } = renderHook(
      ({ progressMs }) => usePlaybackClock(progressMs, 60_000, true),
      { initialProps: { progressMs: 5_000 } },
    );

    act(() => {
      jest.advanceTimersByTime(2 * ETime.SECOND);
    });

    rerender({ progressMs: 20_000 });
    expect(result.current).toBe(20_000);
  });

  it("does not advance while paused", () => {
    const { result } = renderHook(() =>
      usePlaybackClock(10_000, 60_000, false),
    );

    act(() => {
      jest.advanceTimersByTime(5 * ETime.SECOND);
    });

    expect(result.current).toBe(10_000);
  });
});
