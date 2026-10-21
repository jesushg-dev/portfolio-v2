import { buildLocaleAlternates } from "./alternates";

describe("buildLocaleAlternates", () => {
  it("returns canonical and language URLs", () => {
    const alternates = buildLocaleAlternates("es", "/es/privacidad");

    expect(alternates.canonical).toBeTruthy();
    expect(alternates.languages?.en).toBeTruthy();
    expect(alternates.languages?.es).toBeTruthy();
    expect(alternates.languages?.nl).toBeTruthy();
    expect(alternates.languages?.["x-default"]).toBeTruthy();
  });
});
