import {
  buildTenantDocumentTitle,
  shouldUseTenantDocumentTitle,
} from "./tenant-document-title";

describe("shouldUseTenantDocumentTitle", () => {
  it("keeps branded i18n titles on apex", () => {
    expect(shouldUseTenantDocumentTitle(null, true)).toBe(false);
    expect(shouldUseTenantDocumentTitle(null, undefined)).toBe(false);
  });

  it("uses the tenant name on a subdomain even if the profile is missing", () => {
    expect(shouldUseTenantDocumentTitle("lola", undefined)).toBe(true);
    expect(shouldUseTenantDocumentTitle("lola", false)).toBe(true);
  });

  it("does not rewrite the primary owner if they visit their own subdomain", () => {
    expect(shouldUseTenantDocumentTitle("jesus", true)).toBe(false);
  });
});

describe("buildTenantDocumentTitle", () => {
  it("joins name and subtitle", () => {
    expect(buildTenantDocumentTitle("Lola Pérez", "Product designer")).toBe(
      "Lola Pérez | Product designer",
    );
  });

  it("falls back to name only", () => {
    expect(buildTenantDocumentTitle("Lola")).toBe("Lola");
    expect(buildTenantDocumentTitle("Lola", "  ")).toBe("Lola");
  });
});
