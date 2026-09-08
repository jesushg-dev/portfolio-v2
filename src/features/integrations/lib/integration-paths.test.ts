import {
  getIntegrationProviderPath,
  INTEGRATION_PROVIDERS,
  isIntegrationProvider,
} from "./integration-paths";

describe("isIntegrationProvider", () => {
  it("accepts catalog providers", () => {
    for (const provider of INTEGRATION_PROVIDERS) {
      expect(isIntegrationProvider(provider)).toBe(true);
    }
  });

  it("rejects unknown providers", () => {
    expect(isIntegrationProvider("slack")).toBe(false);
  });
});

describe("getIntegrationProviderPath", () => {
  it("builds a locale-prefixed credentials path", () => {
    expect(getIntegrationProviderPath("en", "resend")).toBe(
      "/en/admin/credentials/resend",
    );
    expect(getIntegrationProviderPath("es", "spotify")).toMatch(
      /\/es\/.+\/spotify$/,
    );
  });
});
