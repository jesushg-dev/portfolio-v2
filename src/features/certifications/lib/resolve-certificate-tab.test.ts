import { resolveCertificateTabIndex } from "./resolve-certificate-tab";

describe("resolveCertificateTabIndex", () => {
  it("returns 0 when slug is empty or undefined", () => {
    expect(resolveCertificateTabIndex()).toBe(0);
    expect(resolveCertificateTabIndex([])).toBe(0);
  });

  it("maps frontend slug to FRONTEND index", () => {
    expect(resolveCertificateTabIndex(["frontend"])).toBe(1);
  });

  it("returns -1 for unknown slugs", () => {
    expect(resolveCertificateTabIndex(["unknown"])).toBe(-1);
  });
});
