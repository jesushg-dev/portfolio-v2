import type { NextRequest } from "next/server";

jest.mock("next-intl/middleware", () => () => (req: { url: string }) => {
  const { NextResponse } =
    jest.requireMock<typeof import("next/server")>("next/server");
  const response = NextResponse.next();
  const url = new URL(req.url);
  if (!/^\/(en|es|nl)(\/|$)/.test(url.pathname))
    url.pathname = `/en${url.pathname}`;
  response.headers.set("x-middleware-rewrite", url.toString());
  return response;
});

jest.mock("./i18n/routing-config", () => ({
  routing: { locales: ["en", "es", "nl"], defaultLocale: "en" },
}));

jest.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers = new Headers();

    constructor(_body?: null, options?: { status?: number }) {
      this.status = options?.status ?? 200;
    }

    static next() {
      return new MockNextResponse();
    }

    static redirect(url: URL, status = 307) {
      const response = new MockNextResponse(null, { status });
      response.headers.set("location", url.toString());
      return response;
    }
  }

  return { NextResponse: MockNextResponse };
});

import middleware from "./proxy";
import { TENANT_USERNAME_HEADER } from "@/lib/tenant/headers";

function request(url: string, host = "jesushg.com"): NextRequest {
  const parsed = new URL(url);
  return {
    url,
    nextUrl: {
      pathname: parsed.pathname,
      searchParams: parsed.searchParams,
      clone() {
        return new URL(url);
      },
    },
    headers: {
      get: (name: string) => (name.toLowerCase() === "host" ? host : null),
    },
  } as unknown as NextRequest;
}

describe("middleware / proxy", () => {
  it("redirects legacy process page paths", () => {
    const response = middleware(request("https://jesushg.com/how-i-use-ai"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toContain("/process/how-i-use-ai");
  });

  it("forwards tenant username from a subdomain", () => {
    const response = middleware(
      request("https://ada.jesushg.com/en", "ada.jesushg.com"),
    );
    expect(
      response.headers.get(`x-middleware-request-${TENANT_USERNAME_HEADER}`),
    ).toBe("ada");
  });

  it("routes PDF mode outside the public site shell", () => {
    const response = middleware(
      request("https://jesushg.com/curriculum-vitae?pdf=1"),
    );
    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/p/primary/en/cv-render?pdf=1",
    );
  });
});
