import {
  detectLocaleFromRequestHeaders,
  getTwoFactorOtpEmailCopy,
} from "./auth-email";

describe("detectLocaleFromRequestHeaders", () => {
  it("defaults to English without headers", () => {
    expect(detectLocaleFromRequestHeaders(undefined)).toBe("en");
    expect(detectLocaleFromRequestHeaders(new Headers())).toBe("en");
  });

  it("prefers the next-intl cookie", () => {
    const headers = new Headers({
      cookie: "theme=dark; NEXT_LOCALE=nl; other=1",
      referer: "https://jesushg.com/es/iniciar-sesion",
      "accept-language": "es-419,es;q=0.9",
    });
    expect(detectLocaleFromRequestHeaders(headers)).toBe("nl");
  });

  it("falls back to the locale prefix in the referer path", () => {
    const headers = new Headers({
      referer: "https://jesushg.com/es/iniciar-sesion?next=%2Fadmin",
      "accept-language": "nl",
    });
    expect(detectLocaleFromRequestHeaders(headers)).toBe("es");
  });

  it("ignores unsupported cookie values and unprefixed referers", () => {
    const headers = new Headers({
      cookie: "NEXT_LOCALE=fr",
      referer: "https://jesushg.com/login",
      "accept-language": "nl-NL,nl;q=0.9,en;q=0.8",
    });
    expect(detectLocaleFromRequestHeaders(headers)).toBe("nl");
  });

  it("survives a malformed referer", () => {
    const headers = new Headers({ referer: "not a url" });
    expect(detectLocaleFromRequestHeaders(headers)).toBe("en");
  });
});

describe("getTwoFactorOtpEmailCopy", () => {
  it("has copy for every locale", () => {
    for (const locale of ["en", "es", "nl"] as const) {
      const copy = getTwoFactorOtpEmailCopy(locale);
      expect(copy.subject.length).toBeGreaterThan(0);
      expect(copy.body.length).toBeGreaterThan(0);
    }
  });
});
