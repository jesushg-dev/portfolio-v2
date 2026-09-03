import {
  geocodePlace,
  locationQueryFromContacts,
  parseLatLon,
  resolveOwnerMapLocation,
} from "./geocode-place";

describe("parseLatLon", () => {
  it("parses a coordinate pair", () => {
    expect(parseLatLon("52.3676, 4.9041")).toEqual({
      lat: 52.3676,
      lon: 4.9041,
    });
  });

  it("rejects out-of-range values", () => {
    expect(parseLatLon("91, 0")).toBeNull();
  });
});

describe("locationQueryFromContacts", () => {
  it("uses the LOCATION contact only", () => {
    expect(
      locationQueryFromContacts([
        { type: "EMAIL", value: "a@b.com" },
        { type: "LOCATION", value: "Amsterdam, Netherlands" },
      ]),
    ).toBe("Amsterdam, Netherlands");
  });

  it("returns null when the tenant has no location", () => {
    expect(
      locationQueryFromContacts([{ type: "PHONE", value: "+505 000" }]),
    ).toBeNull();
  });
});

describe("geocodePlace", () => {
  it("does not call Nominatim when the value is already coordinates", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(geocodePlace("12.1, -86.2")).resolves.toEqual({
      lat: 12.1,
      lon: -86.2,
      label: "12.1, -86.2",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("resolveOwnerMapLocation", () => {
  it("prefers stored coordinates over geocoding", async () => {
    await expect(
      resolveOwnerMapLocation({
        mapLatitude: 52.3676,
        mapLongitude: 4.9041,
        mapLocationLabel: "Amsterdam",
      }),
    ).resolves.toEqual({
      lat: 52.3676,
      lon: 4.9041,
      label: "Amsterdam",
    });
  });
});
