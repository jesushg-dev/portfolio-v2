import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing-config";
import { matchLegacyProcessPageRedirect } from "@/features/process-pages/lib/legacy-process-page-redirects";
import {
  CV_PDF_MODE_HEADER,
  TENANT_USERNAME_HEADER,
} from "@/lib/tenant/headers";
import { getPrimaryDomain, parseTenantSlug } from "@/lib/tenant/parse-host";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Adds Next.js' request-header override convention to a response so the
 * downstream RSC/route handler sees the augmented request headers.
 */
const forwardRequestHeader = (
  response: NextResponse,
  name: string,
  value: string,
) => {
  response.headers.set(`x-middleware-request-${name}`, value);
  const existing = response.headers.get("x-middleware-override-headers");
  const list = existing
    ? existing
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    : [];
  if (!list.includes(name)) list.push(name);
  response.headers.set("x-middleware-override-headers", list.join(","));
};

export default function middleware(req: NextRequest) {
  const legacyProcessPath = matchLegacyProcessPageRedirect(
    req.nextUrl.pathname,
  );
  if (legacyProcessPath) {
    const url = req.nextUrl.clone();
    url.pathname = legacyProcessPath;
    return NextResponse.redirect(url, 301);
  }

  const tenantSlug = parseTenantSlug(
    req.headers.get("host"),
    getPrimaryDomain(),
  );

  const response = intlMiddleware(req) ?? NextResponse.next();

  forwardRequestHeader(response, "pathname", req.nextUrl.pathname);

  if (tenantSlug) {
    forwardRequestHeader(response, TENANT_USERNAME_HEADER, tenantSlug);
    response.headers.set(TENANT_USERNAME_HEADER, tenantSlug);
  }

  if (req.nextUrl.searchParams.get("pdf") === "1") {
    forwardRequestHeader(response, CV_PDF_MODE_HEADER, "1");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)", "/"],
};
