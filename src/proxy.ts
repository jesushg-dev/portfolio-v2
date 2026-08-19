import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing-config";
import {
  CV_PDF_MODE_HEADER,
  TENANT_USERNAME_HEADER,
} from "@/lib/tenant/headers";

const intlMiddleware = createIntlMiddleware(routing);

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "dashboard",
  "app",
  "admin",
  "api",
  "auth",
]);

const PRIMARY_DOMAIN = process.env.PRIMARY_DOMAIN ?? "jesushg.com";

/**
 * Parses a tenant slug from the request host. Returns:
 * - { type: "apex" } when the host is the primary domain (or localhost / lvh.me)
 * - { type: "tenant", slug } when the host is `<slug>.<primary-domain>`
 * - { type: "reserved" } when the subdomain is reserved (www, dashboard, ...)
 */
const parseHost = (
  host: string | null,
): { type: "apex" | "reserved" } | { type: "tenant"; slug: string } => {
  if (!host) return { type: "apex" };

  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (!hostname || hostname === "localhost" || hostname === "lvh.me") {
    return { type: "apex" };
  }

  if (hostname === PRIMARY_DOMAIN) return { type: "apex" };

  let suffix: string | null = null;
  if (hostname.endsWith(`.${PRIMARY_DOMAIN}`)) suffix = PRIMARY_DOMAIN;
  else if (hostname.endsWith(".lvh.me")) suffix = "lvh.me";
  else if (hostname.endsWith(".localhost")) suffix = "localhost";

  if (!suffix) return { type: "apex" };

  const slug = hostname.slice(0, -1 - suffix.length);
  if (!slug) return { type: "apex" };
  if (RESERVED_SUBDOMAINS.has(slug)) return { type: "reserved" };

  return { type: "tenant", slug };
};

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
  const parsed = parseHost(req.headers.get("host"));

  const response = intlMiddleware(req) ?? NextResponse.next();

  forwardRequestHeader(response, "pathname", req.nextUrl.pathname);

  if (parsed.type === "tenant") {
    forwardRequestHeader(response, TENANT_USERNAME_HEADER, parsed.slug);
    response.headers.set(TENANT_USERNAME_HEADER, parsed.slug);
  }

  if (req.nextUrl.searchParams.get("pdf") === "1") {
    forwardRequestHeader(response, CV_PDF_MODE_HEADER, "1");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)", "/"],
};
