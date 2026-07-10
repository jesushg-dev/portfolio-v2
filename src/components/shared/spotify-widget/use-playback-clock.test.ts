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
    const { result } = renderHook(() =>
      usePlaybackClock("track-1", 10_000, 60_000, true),
    );

    expect(result.current).toBe(10_000);

    act(() => {
      jest.advanceTimersByTime(3 * ETime.SECOND);
    });

    expect(result.current).toBe(13_000);
  });

  it("resyncs when Spotify reports a new progressMs", () => {
    const { result, rerender } = renderHook(
      ({ progressMs }) => usePlaybackClock("track-1", progressMs, 60_000, true),
      { initialProps: { progressMs: 5_000 } },
    );

    act(() => {
      jest.advanceTimersByTime(2 * ETime.SECOND);
    });

    rerender({ progressMs: 20_000 });
    expect(result.current).toBe(20_000);
  });

  it("resets when the track changes", () => {
    const { result, rerender } = renderHook(
      ({ contentId, progressMs }) =>
        usePlaybackClock(contentId, progressMs, 248_000, true),
      { initialProps: { contentId: "track-1", progressMs: 175_000 } },
    );

    act(() => {
      jest.advanceTimersByTime(3 * ETime.SECOND);
    });

    expect(result.current).toBe(178_000);

    rerender({ contentId: "track-2", progressMs: 4_000 });

    expect(result.current).toBe(4_000);
  });

  it("drops carried progress from the previous track", () => {
    const { result, rerender } = renderHook(
      ({ contentId, progressMs, durationMs }) =>
        usePlaybackClock(contentId, progressMs, durationMs, true),
      {
        initialProps: {
          contentId: "track-1",
          progressMs: 248_000,
          durationMs: 248_000,
        },
      },
    );

    rerender({
      contentId: "track-2",
      progressMs: 248_000,
      durationMs: 200_000,
    });

    expect(result.current).toBe(0);
  });

  it("does not advance while paused", () => {
    const { result } = renderHook(() =>
      usePlaybackClock("track-1", 10_000, 60_000, false),
    );

    act(() => {
      jest.advanceTimersByTime(5 * ETime.SECOND);
    });

    expect(result.current).toBe(10_000);
  });

  it("initializes cleanly after remount on a new track", () => {
    const { unmount } = renderHook(
      ({ contentId, progressMs, durationMs }) =>
        usePlaybackClock(contentId, progressMs, durationMs, true),
      {
        initialProps: {
          contentId: "track-1",
          progressMs: 220_000,
          durationMs: 248_000,
        },
      },
    );

    act(() => {
      jest.advanceTimersByTime(5 * ETime.SECOND);
    });

    unmount();

    const { result } = renderHook(() =>
      usePlaybackClock("track-2", 3_000, 200_000, true),
    );

    expect(result.current).toBe(3_000);
  });
});
