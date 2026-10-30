import { getPathname } from "@/i18n/routing";

import {
  buildLocalizedSitemapEntries,
  INDEXABLE_SITEMAP_PATHS,
  PUBLIC_SITEMAP_PATHS,
} from "./build-sitemap";

jest.mock("@/i18n/routing", () => {
  const { defaultLocale, pathnames } = jest.requireActual<{
    defaultLocale: string;
    pathnames: Record<string, string | Record<string, string>>;
  }>("@/i18n/config");

  return {
    getPathname: jest.fn(
      ({
        locale,
        href,
      }: {
        locale: string;
        href: string | { pathname: string; params: { slug: string } };
      }) => {
        const pathname = typeof href === "string" ? href : href.pathname;
        const localized = pathnames[pathname];
        let path =
          typeof localized === "string" ? localized : localized[locale];
        if (typeof href !== "string") {
          path = path.replace("[slug]", href.params.slug);
        }
        return locale === defaultLocale
          ? path
          : `/${locale}${path === "/" ? "" : path}`;
      },
    ),
  };
});

describe("buildLocalizedSitemapEntries", () => {
  it("lists each language URL with reciprocal alternates", () => {
    const entries = buildLocalizedSitemapEntries("/projects", {
      priority: 1,
      changeFrequency: "weekly",
    });

    const languages = {
      en: "https://www.jesushg.com/projects",
      es: "https://www.jesushg.com/es/proyectos",
      nl: "https://www.jesushg.com/nl/projecten",
      "x-default": "https://www.jesushg.com/projects",
    };
    expect(entries.map((entry) => entry.url)).toEqual([
      languages.en,
      languages.es,
      languages.nl,
    ]);
    for (const entry of entries) {
      expect(entry.priority).toBe(1);
      expect(entry.changeFrequency).toBe("weekly");
      expect(entry.alternates?.languages).toEqual(languages);
    }
  });

  it("includes all localized dynamic project URLs", () => {
    const entries = buildLocalizedSitemapEntries({
      pathname: "/projects/[slug]",
      params: { slug: "portfolio" },
    });

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://www.jesushg.com/projects/portfolio",
      "https://www.jesushg.com/es/proyectos/portfolio",
      "https://www.jesushg.com/nl/projecten/portfolio",
    ]);
  });

  it("does not duplicate URLs when locale prefixes are disabled", () => {
    const pathname = jest.mocked(getPathname);
    pathname.mockReturnValueOnce("/projects");
    pathname.mockReturnValueOnce("/projects");
    pathname.mockReturnValueOnce("/projects");
    pathname.mockReturnValueOnce("/projects");

    expect(buildLocalizedSitemapEntries("/projects")).toHaveLength(1);
  });
});

describe("INDEXABLE_SITEMAP_PATHS", () => {
  it("includes main portfolio pages and excludes /uses", () => {
    expect(INDEXABLE_SITEMAP_PATHS).toEqual(
      expect.arrayContaining([
        "/projects",
        "/certificates",
        "/curriculum-vitae",
        "/timeline",
        "/now",
        "/colophon",
        "/stats",
      ]),
    );
    expect(INDEXABLE_SITEMAP_PATHS).not.toContain("/uses");
    expect(PUBLIC_SITEMAP_PATHS).toContain("/uses");
  });
});
