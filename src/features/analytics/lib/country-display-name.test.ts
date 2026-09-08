import { countryDisplayName } from "./country-display-name";

describe("countryDisplayName", () => {
  it("uses Intl region names and a fallback for unknown codes", () => {
    expect(countryDisplayName("NL", "en", "Unknown")).toBe("Netherlands");
    expect(countryDisplayName("XX", "en", "Unknown")).toBe("Unknown");
  });
});
