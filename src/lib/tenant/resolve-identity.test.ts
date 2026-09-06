import {
  createPdfTenantProof,
  isValidPdfTenantProof,
  resolveTenantIdentity,
} from "./resolve-identity";

const secret = "cv-pdf-generator-secret-value";
const primary = "jesushg.com";

describe("isValidPdfTenantProof", () => {
  it("accepts a matching HMAC and rejects spoofed proofs", () => {
    const proof = createPdfTenantProof("alice", secret);
    expect(isValidPdfTenantProof("alice", proof, secret)).toBe(true);
    expect(isValidPdfTenantProof("bob", proof, secret)).toBe(false);
    expect(isValidPdfTenantProof("alice", proof, "other-secret")).toBe(false);
    expect(isValidPdfTenantProof("alice", "deadbeef", secret)).toBe(false);
    expect(isValidPdfTenantProof("alice", proof, undefined)).toBe(false);
  });
});

describe("resolveTenantIdentity", () => {
  it("uses the host subdomain even when a forged username header is present", () => {
    expect(
      resolveTenantIdentity({
        host: "alice.jesushg.com",
        primaryDomain: primary,
        headerUsername: "bob",
        pdfTenantProof: "forged",
        pdfGeneratorSecret: secret,
      }),
    ).toEqual({ type: "slug", slug: "alice" });
  });

  it("ignores a client username header on apex without a valid PDF proof", () => {
    expect(
      resolveTenantIdentity({
        host: "jesushg.com",
        primaryDomain: primary,
        headerUsername: "alice",
        pdfTenantProof: "",
        pdfGeneratorSecret: secret,
      }),
    ).toEqual({ type: "primary" });
  });

  it("binds apex to a tenant only with a valid PDF HMAC", () => {
    expect(
      resolveTenantIdentity({
        host: "jesushg.com",
        primaryDomain: primary,
        headerUsername: "alice",
        pdfTenantProof: createPdfTenantProof("alice", secret),
        pdfGeneratorSecret: secret,
      }),
    ).toEqual({ type: "slug", slug: "alice" });
  });
});
