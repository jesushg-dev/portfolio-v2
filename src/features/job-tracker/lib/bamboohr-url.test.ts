import { ImportFromUrlError } from "./import-from-url-errors";
import {
  isAllowedBambooHrHost,
  isSafeBambooHrHref,
  parseBambooHrUrl,
} from "./bamboohr-url";

describe("isAllowedBambooHrHost", () => {
  it("accepts valid company subdomains", () => {
    expect(isAllowedBambooHrHost("gsdplus.bamboohr.com")).toBe(true);
    expect(isAllowedBambooHrHost("my-company.bamboohr.com")).toBe(true);
    expect(isAllowedBambooHrHost("company.bamboohr.co.uk")).toBe(true);
  });

  it("rejects root, system, or invalid hostnames", () => {
    expect(isAllowedBambooHrHost("bamboohr.com")).toBe(false);
    expect(isAllowedBambooHrHost("www.bamboohr.com")).toBe(false);
    expect(isAllowedBambooHrHost("api.bamboohr.com")).toBe(false);
    expect(isAllowedBambooHrHost("staticfe.bamboohr.com")).toBe(false);
    expect(isAllowedBambooHrHost("linkedin.com")).toBe(false);
    expect(isAllowedBambooHrHost("evil-bamboohr.com")).toBe(false);
  });
});

describe("isSafeBambooHrHref", () => {
  it("accepts safe HTTPS BambooHR hrefs", () => {
    expect(isSafeBambooHrHref("https://gsdplus.bamboohr.com/careers/74")).toBe(
      true,
    );
  });

  it("rejects non-https, non-standard port, or credentials in URL", () => {
    expect(isSafeBambooHrHref("http://gsdplus.bamboohr.com/careers/74")).toBe(
      false,
    );
    expect(
      isSafeBambooHrHref("https://user:pass@gsdplus.bamboohr.com/careers/74"),
    ).toBe(false);
    expect(
      isSafeBambooHrHref("https://gsdplus.bamboohr.com:8080/careers/74"),
    ).toBe(false);
    expect(isSafeBambooHrHref("javascript:alert(1)")).toBe(false);
  });
});

describe("parseBambooHrUrl", () => {
  it("parses a standard careers URL with tracking params", () => {
    const parsed = parseBambooHrUrl(
      "https://gsdplus.bamboohr.com/careers/74?source=aWQ9MTk%3D",
    );
    expect(parsed).toEqual({
      subdomain: "gsdplus",
      jobId: "74",
      detailHref: "https://gsdplus.bamboohr.com/careers/74/detail",
      publicHref: "https://gsdplus.bamboohr.com/careers/74",
    });
  });

  it("parses URL without protocol", () => {
    const parsed = parseBambooHrUrl("gsdplus.bamboohr.com/careers/74");
    expect(parsed.jobId).toBe("74");
    expect(parsed.subdomain).toBe("gsdplus");
  });

  it("parses legacy /jobs/view.php?id=74 URL", () => {
    const parsed = parseBambooHrUrl(
      "https://gsdplus.bamboohr.com/jobs/view.php?id=74&source=test",
    );
    expect(parsed.jobId).toBe("74");
    expect(parsed.subdomain).toBe("gsdplus");
  });

  it("parses direct /careers/74/detail URL", () => {
    const parsed = parseBambooHrUrl(
      "https://gsdplus.bamboohr.com/careers/74/detail",
    );
    expect(parsed.jobId).toBe("74");
    expect(parsed.subdomain).toBe("gsdplus");
  });

  it("throws IMPORT_UNSUPPORTED_HOST for root domain without job id", () => {
    expect(() =>
      parseBambooHrUrl("https://gsdplus.bamboohr.com/careers"),
    ).toThrow(ImportFromUrlError);
  });

  it("throws IMPORT_INVALID_URL for empty or garbage input", () => {
    expect(() => parseBambooHrUrl("")).toThrow(ImportFromUrlError);
    expect(() => parseBambooHrUrl("not a url :::")).toThrow(ImportFromUrlError);
  });
});
