import { distanceKm, formatDistanceKm } from "./distance";

describe("distanceKm", () => {
  it("returns 0 for the same point", () => {
    expect(distanceKm({ lat: 52.37, lon: 4.9 }, { lat: 52.37, lon: 4.9 })).toBe(
      0,
    );
  });

  it("measures Amsterdam to London in hundreds of km", () => {
    const km = distanceKm(
      { lat: 52.3676, lon: 4.9041 },
      { lat: 51.5074, lon: -0.1278 },
    );
    expect(km).toBeGreaterThan(300);
    expect(km).toBeLessThan(400);
  });
});

describe("formatDistanceKm", () => {
  it("rounds and appends km", () => {
    expect(formatDistanceKm(5496.2, "en")).toBe("5,496 km");
  });
});
