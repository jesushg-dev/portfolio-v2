import { ImportFromUrlError } from "./import-from-url-errors";
import { importJobFromUrl } from "./import-job-from-url";
import { linkedInGuestJobUrl } from "./linkedin-url";

const JOB_JSON_LD = `<script type="application/ld+json">
{"@type":"JobPosting","title":"Desarrollador","description":"<p>Principales responsabilidades: desarrollar backend</p><p>Más detalle para pasar el umbral de descripción pública.</p>","hiringOrganization":{"name":"JuegaOk"},"jobLocation":{"address":{"addressLocality":"Managua","addressCountry":"Nicaragua"}}}
</script>`;

const GUEST_JOB_HTML = `<div class="show-more-less-html__markup"><p>Principales responsabilidades:</p><ul><li>Desarrollar componentes backend</li></ul></div>
<meta property="og:title" content="JuegaOk hiring Desarrollador in Managua, Nicaragua">`;

const LOGIN_WALL = `<title>Sign in | LinkedIn</title><input name="session_key" /><p>Sign in to view this post</p>`;

describe("importJobFromUrl", () => {
  it("parses a job page from the injected fetcher", async () => {
    const listing = await importJobFromUrl(
      "https://www.linkedin.com/jobs/view/4457394559/",
      () => Promise.resolve(JOB_JSON_LD),
    );
    expect(listing.position).toBe("Desarrollador");
    expect(listing.companyName).toBe("JuegaOk");
    expect(listing.location).toContain("Managua");
    expect(listing.description).toContain("responsabilidades");
  });

  it("falls back to the guest job endpoint when the public page is thin", async () => {
    const thinPage = `<meta property="og:title" content="JuegaOk hiring Desarrollador in Managua, Nicaragua"><meta property="og:description" content="Short">`;
    const fetchHtml = jest.fn((href: string) =>
      Promise.resolve(href.includes("jobs-guest") ? GUEST_JOB_HTML : thinPage),
    );

    const listing = await importJobFromUrl(
      "https://www.linkedin.com/jobs/view/4457394559/",
      fetchHtml,
    );
    expect(fetchHtml).toHaveBeenCalledWith(linkedInGuestJobUrl("4457394559"));
    expect(listing.description).toContain("responsabilidades");
    expect(listing.position).toBe("Desarrollador");
  });

  it("throws LOGIN_WALL when LinkedIn serves a sign-in page", async () => {
    await expect(
      importJobFromUrl(
        "https://www.linkedin.com/posts/someone-activity-1-aa",
        () => Promise.resolve(LOGIN_WALL),
      ),
    ).rejects.toMatchObject({ code: "IMPORT_LOGIN_WALL" });
  });

  it("throws EMPTY_CONTENT when the page has no listing text", async () => {
    await expect(
      importJobFromUrl("https://www.linkedin.com/jobs/view/4457394559/", () =>
        Promise.resolve("<html><title>Empty</title><body>ok</body></html>"),
      ),
    ).rejects.toMatchObject({ code: "IMPORT_EMPTY_CONTENT" });
  });

  it("rejects a non-LinkedIn URL before fetching", async () => {
    const fetchHtml = jest.fn();
    await expect(
      importJobFromUrl("https://example.com/jobs/1", fetchHtml),
    ).rejects.toBeInstanceOf(ImportFromUrlError);
    expect(fetchHtml).not.toHaveBeenCalled();
  });
});
