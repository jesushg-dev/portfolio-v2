import { ImportFromUrlError } from "./import-from-url-errors";
import { importJobFromUrl } from "./import-job-from-url";
import { linkedInGuestJobUrl } from "./linkedin-url";

const JOB_JSON_LD = `<script type="application/ld+json">
{"@type":"JobPosting","title":"Desarrollador","description":"<p>Principales responsabilidades: desarrollar backend</p><p>Más detalle para pasar el umbral de descripción pública.</p>","hiringOrganization":{"name":"JuegaOk"},"jobLocation":{"address":{"addressLocality":"Managua","addressCountry":"Nicaragua"}}}
</script>`;

const GUEST_JOB_HTML = `<div class="show-more-less-html__markup"><p>Principales responsabilidades:</p><ul><li>Desarrollar componentes backend</li></ul></div>
<meta property="og:title" content="JuegaOk hiring Desarrollador in Managua, Nicaragua">`;

const LOGIN_WALL = `<title>Sign in | LinkedIn</title><input name="session_key" /><p>Sign in to view this post</p>`;

const BAMBOO_DETAIL_JSON = JSON.stringify({
  result: {
    jobOpening: {
      jobOpeningName: "Desarrollador FullStack",
      atsLocation: { country: "Colombia" },
      description:
        "<p>OBJETIVO: Desarrollar soluciones web con React y Node.</p>",
    },
  },
});

const BAMBOO_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:site_name" content="GSD PLUS"/>
  <meta property="og:title" content="Desarrollador FullStack"/>
</head>
<body></body>
</html>
`;

const GETONBRD_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Full-Stack Developer – Node.js at Cencosud (via BC Tecnología)"/>
  <meta property="og:description" content="Trabajo remoto Full time"/>
</head>
<body>
  <div itemprop="hiringOrganization"><strong itemprop="name">BC Tecnología</strong></div>
  <h1 class="gb-landing-cover__title"><span itemprop="title">Full-Stack Developer – Node.js</span></h1>
  <span class="location">Remote</span>
  <div id="job-body" itemprop="description">
    <p>Buscamos un/a Fullstack Developer para proyectos cloud.</p>
    <ul><li>Experiencia con Node.js y React.</li></ul>
  </div>
</body>
</html>
`;

describe("importJobFromUrl", () => {
  describe("LinkedIn", () => {
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
        Promise.resolve(
          href.includes("jobs-guest") ? GUEST_JOB_HTML : thinPage,
        ),
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
  });

  describe("BambooHR", () => {
    it("parses a BambooHR careers URL fetching detail and page HTML", async () => {
      const fetchHtml = jest.fn((href: string) => {
        if (href.endsWith("/detail"))
          return Promise.resolve(BAMBOO_DETAIL_JSON);
        return Promise.resolve(BAMBOO_PAGE_HTML);
      });

      const listing = await importJobFromUrl(
        "https://gsdplus.bamboohr.com/careers/74?source=aWQ9MTk%3D",
        fetchHtml,
      );

      expect(fetchHtml).toHaveBeenCalledWith(
        "https://gsdplus.bamboohr.com/careers/74/detail",
      );
      expect(fetchHtml).toHaveBeenCalledWith(
        "https://gsdplus.bamboohr.com/careers/74",
      );
      expect(listing.position).toBe("Desarrollador FullStack");
      expect(listing.companyName).toBe("GSD PLUS");
      expect(listing.location).toBe("Colombia");
      expect(listing.description).toContain(
        "OBJETIVO: Desarrollar soluciones web",
      );
      expect(listing.sourceType).toBe("bamboohr");
    });

    it("throws EMPTY_CONTENT when BambooHR returns empty content", async () => {
      await expect(
        importJobFromUrl("https://gsdplus.bamboohr.com/careers/74", () =>
          Promise.resolve("{}"),
        ),
      ).rejects.toMatchObject({ code: "IMPORT_EMPTY_CONTENT" });
    });
  });

  describe("Get on Board", () => {
    it("parses a Get on Board job URL", async () => {
      const fetchHtml = jest.fn(() => Promise.resolve(GETONBRD_PAGE_HTML));

      const listing = await importJobFromUrl(
        "https://www.getonbrd.com/jobs/programming/fullstack-developer-node-js-typescript-react-aws-bc-tecnologia-remote",
        fetchHtml,
      );

      expect(fetchHtml).toHaveBeenCalledWith(
        "https://www.getonbrd.com/jobs/programming/fullstack-developer-node-js-typescript-react-aws-bc-tecnologia-remote",
      );
      expect(listing.position).toBe("Full-Stack Developer – Node.js");
      expect(listing.companyName).toBe("BC Tecnología");
      expect(listing.location).toBe("Remote");
      expect(listing.description).toContain(
        "Buscamos un/a Fullstack Developer",
      );
      expect(listing.sourceType).toBe("getonbrd");
    });

    it("throws EMPTY_CONTENT when Get on Board returns empty content", async () => {
      await expect(
        importJobFromUrl(
          "https://www.getonbrd.com/jobs/programming/some-empty-job",
          () => Promise.resolve("<html><body></body></html>"),
        ),
      ).rejects.toMatchObject({ code: "IMPORT_EMPTY_CONTENT" });
    });
  });

  it("rejects an unsupported host before fetching", async () => {
    const fetchHtml = jest.fn();
    await expect(
      importJobFromUrl("https://example.com/jobs/1", fetchHtml),
    ).rejects.toBeInstanceOf(ImportFromUrlError);
    expect(fetchHtml).not.toHaveBeenCalled();
  });
});
