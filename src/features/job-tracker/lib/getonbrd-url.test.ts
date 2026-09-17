import { ImportFromUrlError } from "./import-from-url-errors";
import {
  isAllowedGetOnBrdHost,
  isSafeGetOnBrdHref,
  parseGetOnBrdUrl,
} from "./getonbrd-url";

describe("isAllowedGetOnBrdHost", () => {
  it("accepts valid Get on Board domains", () => {
    expect(isAllowedGetOnBrdHost("getonbrd.com")).toBe(true);
    expect(isAllowedGetOnBrdHost("www.getonbrd.com")).toBe(true);
    expect(isAllowedGetOnBrdHost("getonbrd.cl")).toBe(true);
    expect(isAllowedGetOnBrdHost("www.getonbrd.cl")).toBe(true);
    expect(isAllowedGetOnBrdHost("getonbrd.pe")).toBe(true);
  });

  it("rejects non-Get on Board hostnames", () => {
    expect(isAllowedGetOnBrdHost("linkedin.com")).toBe(false);
    expect(isAllowedGetOnBrdHost("evilgetonbrd.com")).toBe(false);
    expect(isAllowedGetOnBrdHost("getonbrd.com.attacker.com")).toBe(false);
  });
});

describe("isSafeGetOnBrdHref", () => {
  it("accepts safe HTTPS Get on Board URLs", () => {
    expect(
      isSafeGetOnBrdHref(
        "https://www.getonbrd.com/jobs/programming/fullstack-developer-node-js",
      ),
    ).toBe(true);
  });

  it("rejects non-https, ports or credentials in URL", () => {
    expect(
      isSafeGetOnBrdHref(
        "http://www.getonbrd.com/jobs/programming/fullstack-developer",
      ),
    ).toBe(false);
    expect(
      isSafeGetOnBrdHref(
        "https://user:pass@www.getonbrd.com/jobs/programming/fullstack-developer",
      ),
    ).toBe(false);
    expect(
      isSafeGetOnBrdHref(
        "https://www.getonbrd.com:8080/jobs/programming/fullstack",
      ),
    ).toBe(false);
  });
});

describe("parseGetOnBrdUrl", () => {
  it("parses full URL with category and tracking params", () => {
    const parsed = parseGetOnBrdUrl(
      "https://www.getonbrd.com/jobs/programming/fullstack-developer-node-js-typescript-react-aws-bc-tecnologia-remote?utm_source=twitter",
    );
    expect(parsed.category).toBe("programming");
    expect(parsed.slug).toBe(
      "fullstack-developer-node-js-typescript-react-aws-bc-tecnologia-remote",
    );
    expect(parsed.href).toBe(
      "https://www.getonbrd.com/jobs/programming/fullstack-developer-node-js-typescript-react-aws-bc-tecnologia-remote",
    );
  });

  it("parses URL without protocol", () => {
    const parsed = parseGetOnBrdUrl(
      "www.getonbrd.com/jobs/programming/fullstack-developer-node-js",
    );
    expect(parsed.slug).toBe("fullstack-developer-node-js");
    expect(parsed.category).toBe("programming");
  });

  it("parses URL without category path", () => {
    const parsed = parseGetOnBrdUrl(
      "https://www.getonbrd.com/jobs/fullstack-developer-node-js",
    );
    expect(parsed.slug).toBe("fullstack-developer-node-js");
    expect(parsed.category).toBeUndefined();
  });

  it("throws IMPORT_UNSUPPORTED_HOST for root or non-job URL", () => {
    expect(() =>
      parseGetOnBrdUrl("https://www.getonbrd.com/companies"),
    ).toThrow(ImportFromUrlError);
  });

  it("throws IMPORT_INVALID_URL for invalid URL input", () => {
    expect(() => parseGetOnBrdUrl("")).toThrow(ImportFromUrlError);
    expect(() => parseGetOnBrdUrl("::: invalid")).toThrow(ImportFromUrlError);
  });
});
