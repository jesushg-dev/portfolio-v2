import {
  isCarriedPlaybackProgress,
  resolveProgressOnTrackChange,
} from "./resolve-track-progress";

describe("resolveProgressOnTrackChange", () => {
  it("drops progress carried over from the previous track", () => {
    expect(
      resolveProgressOnTrackChange(248_000, 200_000, 248_000, 248_000),
    ).toBe(0);
  });

  it("keeps a plausible start position for the new track", () => {
    expect(resolveProgressOnTrackChange(4_000, 200_000, 248_000, 248_000)).toBe(
      4_000,
    );
  });

  it("keeps a mid-track seek on the new song", () => {
    expect(
      resolveProgressOnTrackChange(120_000, 200_000, 248_000, 248_000),
    ).toBe(120_000);
  });
});

describe("isCarriedPlaybackProgress", () => {
  it("detects stale carryover near the end of the previous track", () => {
    expect(isCarriedPlaybackProgress(248_000, 200_000, 248_000, 248_000)).toBe(
      true,
    );
  });
});
