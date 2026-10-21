import { ImportFromUrlError } from "./import-from-url-errors";
import {
  isAllowedLinkedInHost,
  isSafeLinkedInHref,
  linkedInGuestJobUrl,
  parseLinkedInUrl,
} from "./linkedin-url";

describe("parseLinkedInUrl", () => {
  it("canonicalizes a job view URL and drops tracking params", () => {
    const parsed = parseLinkedInUrl(
      "https://www.linkedin.com/jobs/view/4457394559/?utm_source=share&utm_medium=member_desktop",
    );
    expect(parsed).toEqual({
      href: "https://www.linkedin.com/jobs/view/4457394559/",
      sourceType: "job",
      jobId: "4457394559",
    });
  });

  it("accepts country subdomains such as ni.linkedin.com", () => {
    const parsed = parseLinkedInUrl(
      "https://ni.linkedin.com/jobs/view/desarrollador-at-juegaok-4457394559",
    );
    expect(parsed.jobId).toBe("4457394559");
    expect(parsed.sourceType).toBe("job");
  });

  it("accepts a missing protocol and a slug-prefixed job id", () => {
    const parsed = parseLinkedInUrl(
      "linkedin.com/jobs/view/desarrollador-at-juegaok-4457394559",
    );
    expect(parsed.jobId).toBe("4457394559");
    expect(parsed.sourceType).toBe("job");
  });

  it("reads currentJobId from collection URLs", () => {
    const parsed = parseLinkedInUrl(
      "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4457394559",
    );
    expect(parsed.jobId).toBe("4457394559");
    expect(parsed.href).toBe("https://www.linkedin.com/jobs/view/4457394559/");
  });

  it("classifies activity posts and strips utm/rcm", () => {
    const parsed = parseLinkedInUrl(
      "https://www.linkedin.com/posts/carol-perez-03_backenddeveloper-dotnet-netcore-activity-7498451636487389184-74mH?utm_source=share&utm_medium=member_desktop&rcm=ACoAAC4IeDIB3WENepviP3BsV1QDDA3FiDGXJis",
    );
    expect(parsed.sourceType).toBe("post");
    expect(parsed.activityId).toBe("7498451636487389184");
    expect(parsed.href).not.toContain("utm_");
    expect(parsed.href).not.toContain("rcm=");
  });

  it("classifies feed update URNs as posts", () => {
    const parsed = parseLinkedInUrl(
      "https://www.linkedin.com/feed/update/urn:li:activity:7498451636487389184",
    );
    expect(parsed.sourceType).toBe("post");
    expect(parsed.activityId).toBe("7498451636487389184");
  });

  it("rejects non-LinkedIn hosts", () => {
    expect(() => parseLinkedInUrl("https://example.com/jobs/view/1")).toThrow(
      ImportFromUrlError,
    );
    try {
      parseLinkedInUrl("https://example.com/jobs/view/1");
    } catch (error) {
      expect(error).toBeInstanceOf(ImportFromUrlError);
      expect((error as ImportFromUrlError).code).toBe(
        "IMPORT_UNSUPPORTED_HOST",
      );
    }
  });

  it("rejects invalid URLs and non-http schemes", () => {
    expect(() => parseLinkedInUrl("not a url")).toThrow(ImportFromUrlError);
    expect(() => parseLinkedInUrl("javascript:alert(1)")).toThrow(
      ImportFromUrlError,
    );
  });
});

describe("isSafeLinkedInHref", () => {
  it("allows https LinkedIn hosts only", () => {
    expect(isAllowedLinkedInHost("www.linkedin.com")).toBe(true);
    expect(isAllowedLinkedInHost("ni.linkedin.com")).toBe(true);
    expect(isAllowedLinkedInHost("linkedin.com.evil.com")).toBe(false);
    expect(
      isSafeLinkedInHref(
        "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/1",
      ),
    ).toBe(true);
    expect(isSafeLinkedInHref("https://ni.linkedin.com/jobs/view/1")).toBe(
      true,
    );
    expect(isSafeLinkedInHref("https://evil.com")).toBe(false);
    expect(isSafeLinkedInHref("http://www.linkedin.com/jobs/view/1")).toBe(
      false,
    );
    expect(
      isSafeLinkedInHref("https://user:pass@www.linkedin.com/jobs/view/1"),
    ).toBe(false);
  });
});

describe("linkedInGuestJobUrl", () => {
  it("builds the public guest job endpoint", () => {
    expect(linkedInGuestJobUrl("4457394559")).toBe(
      "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4457394559",
    );
  });
});
