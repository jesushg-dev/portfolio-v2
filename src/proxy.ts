import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing-config";
import { matchLegacyProcessPageRedirect } from "@/features/process-pages/lib/legacy-process-page-redirects";
import { TENANT_USERNAME_HEADER } from "@/lib/tenant/headers";
import { getPrimaryDomain, parseTenantSlug } from "@/lib/tenant/parse-host";
import {
  isAccountPath,
  PUBLIC_RENDER_PREFIX,
  publicRenderScope,
} from "@/lib/public-site/routing";

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
  // Only host-derived rewrites may select a tenant's render/cache namespace.
  if (
    req.nextUrl.pathname === PUBLIC_RENDER_PREFIX ||
    req.nextUrl.pathname.startsWith(`${PUBLIC_RENDER_PREFIX}/`)
  ) {
    return new NextResponse(null, { status: 404 });
  }
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

  if (["/sitemap.xml", "/robots.txt"].includes(req.nextUrl.pathname)) {
    if (!tenantSlug) return NextResponse.next();
    const destination = req.nextUrl.clone();
    destination.pathname = `${PUBLIC_RENDER_PREFIX}/${publicRenderScope(tenantSlug)}${req.nextUrl.pathname}`;
    return NextResponse.rewrite(destination);
  }

  const response = intlMiddleware(req) ?? NextResponse.next();

  forwardRequestHeader(response, "pathname", req.nextUrl.pathname);

  if (tenantSlug) {
    forwardRequestHeader(response, TENANT_USERNAME_HEADER, tenantSlug);
    response.headers.set(TENANT_USERNAME_HEADER, tenantSlug);
  }

  const rewrite = response.headers.get("x-middleware-rewrite");
  if (!response.headers.has("location") && response.status < 300) {
    const destination = new URL(rewrite ?? req.url, req.url);
    const [, locale, ...segments] = destination.pathname.split("/");
    const pathname = `/${segments.join("/")}`;
    if (
      routing.locales.includes(locale as (typeof routing.locales)[number]) &&
      !isAccountPath(pathname)
    ) {
      const renderPath =
        pathname === "/curriculum-vitae" &&
        req.nextUrl.searchParams.get("pdf") === "1"
          ? "/cv-render"
          : pathname;
      destination.pathname = `${PUBLIC_RENDER_PREFIX}/${publicRenderScope(tenantSlug)}/${locale}${renderPath === "/" ? "" : renderPath}`;
      response.headers.set("x-middleware-rewrite", destination.toString());
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
    "/",
    "/p/:path*",
    "/sitemap.xml",
    "/robots.txt",
  ],
};
