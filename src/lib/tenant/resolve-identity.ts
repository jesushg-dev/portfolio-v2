import { createHmac, timingSafeEqual } from "node:crypto";

import { parseTenantSlug } from "@/lib/tenant/parse-host";

export type TenantIdentity =
  { type: "slug"; slug: string } | { type: "primary" };

export function createPdfTenantProof(username: string, secret: string): string {
  return createHmac("sha256", secret).update(username).digest("hex");
}

export function isValidPdfTenantProof(
  username: string,
  proof: string,
  secret: string | undefined,
): boolean {
  const slug = username.trim();
  const token = proof.trim();
  if (!secret || !slug || !token) return false;

  const expected = createPdfTenantProof(slug, secret);
  const actualBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Host is the only untrusted-request source of tenant identity.
 * `x-tenant-username` is honored only with a HMAC from CV_PDF_GENERATOR_SECRET
 * (Playwright PDF on apex / preview hosts that have no tenant subdomain).
 */
export function resolveTenantIdentity(input: {
  host: string | null;
  primaryDomain: string;
  headerUsername?: string;
  pdfTenantProof?: string;
  pdfGeneratorSecret?: string;
}): TenantIdentity {
  const hostSlug = parseTenantSlug(input.host, input.primaryDomain);
  if (hostSlug) {
    return { type: "slug", slug: hostSlug };
  }

  const headerSlug = input.headerUsername?.trim() ?? "";
  if (
    headerSlug &&
    isValidPdfTenantProof(
      headerSlug,
      input.pdfTenantProof ?? "",
      input.pdfGeneratorSecret,
    )
  ) {
    return { type: "slug", slug: headerSlug };
  }

  return { type: "primary" };
}
