import {
  groupBlogPosts,
  mapBlogPostToEditorDto,
  resolveSeriesTitle,
  type BlogPostWithTranslations,
} from "./blog-editor-dto";

const mockLanguages = [
  { id: "lang-en", code: "en", name: "English" },
  { id: "lang-es", code: "es", name: "Spanish" },
  { id: "lang-nl", code: "nl", name: "Dutch" },
];

describe("blog-editor-dto", () => {
  describe("resolveSeriesTitle", () => {
    const seriesWithTrans = {
      slug: "os-architecture",
      translations: [
        {
          appLanguageId: "lang-es",
          title: "Arquitectura de Sistemas Operativos",
        },
        {
          appLanguageId: "lang-en",
          title: "Operating Systems Architecture",
        },
        {
          appLanguageId: "lang-nl",
          title: "Besturingssysteemarchitectuur",
        },
      ],
    };

    it("resolves the exact title for requested locale", () => {
      expect(resolveSeriesTitle(seriesWithTrans, mockLanguages, "en")).toBe(
        "Operating Systems Architecture",
      );

      expect(resolveSeriesTitle(seriesWithTrans, mockLanguages, "es")).toBe(
        "Arquitectura de Sistemas Operativos",
      );

      expect(resolveSeriesTitle(seriesWithTrans, mockLanguages, "nl")).toBe(
        "Besturingssysteemarchitectuur",
      );
    });

    it("falls back to English when requested locale has no translation", () => {
      const partialSeries = {
        slug: "partial-series",
        translations: [{ appLanguageId: "lang-en", title: "English Title" }],
      };
      expect(resolveSeriesTitle(partialSeries, mockLanguages, "nl")).toBe(
        "English Title",
      );
    });

    it("falls back to slug when no translations are provided", () => {
      const emptySeries = { slug: "my-series", translations: [] };
      expect(resolveSeriesTitle(emptySeries, mockLanguages, "en")).toBe(
        "my-series",
      );
    });
  });

  describe("mapBlogPostToEditorDto", () => {
    const post: BlogPostWithTranslations = {
      id: "post-1",
      userId: "user-1",
      slug: "first-post",
      coverImage: null,
      tags: ["linux", "kernel"],
      seriesId: "series-1",
      seriesOrder: 2,
      status: "PUBLISHED",
      publishedAt: new Date("2024-01-01T00:00:00Z"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      series: {
        id: "series-1",
        userId: "user-1",
        slug: "os-architecture",
        coverImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [
          {
            appLanguageId: "lang-es",
            title: "Arquitectura de Sistemas Operativos",
          },
          {
            appLanguageId: "lang-en",
            title: "Operating Systems Architecture",
          },
        ],
      },
      translations: [
        {
          id: "tr-1",
          postId: "post-1",
          appLanguageId: "lang-es",
          title: "Primer Post",
          excerpt: "Resumen",
          content: "Contenido",
        },
        {
          id: "tr-2",
          postId: "post-1",
          appLanguageId: "lang-en",
          title: "First Post",
          excerpt: "Excerpt",
          content: "Content",
        },
      ],
    };

    it("maps displayTitle and seriesName according to preferredLocale", () => {
      const enDto = mapBlogPostToEditorDto(post, mockLanguages, "en");
      expect(enDto.displayTitle).toBe("First Post");
      expect(enDto.seriesName).toBe("Operating Systems Architecture");

      const esDto = mapBlogPostToEditorDto(post, mockLanguages, "es");
      expect(esDto.displayTitle).toBe("Primer Post");
      expect(esDto.seriesName).toBe("Arquitectura de Sistemas Operativos");
    });
  });

  describe("groupBlogPosts", () => {
    it("groups posts into series and standalone cleanly and sorts by seriesOrder", () => {
      const postA = {
        id: "1",
        slug: "ch-2",
        coverImage: "",
        tags: [],
        seriesSlug: "my-series",
        seriesName: "My Series",
        seriesOrder: 2,
        status: "PUBLISHED" as const,
        publishedAt: null,
        displayTitle: "Chapter 2",
        translations: {},
      };
      const postB = {
        id: "2",
        slug: "ch-1",
        coverImage: "",
        tags: [],
        seriesSlug: "my-series",
        seriesName: "My Series",
        seriesOrder: 1,
        status: "PUBLISHED" as const,
        publishedAt: null,
        displayTitle: "Chapter 1",
        translations: {},
      };
      const postStandalone = {
        id: "3",
        slug: "standalone-article",
        coverImage: "",
        tags: [],
        seriesSlug: "",
        seriesName: "",
        seriesOrder: null,
        status: "PUBLISHED" as const,
        publishedAt: null,
        displayTitle: "Standalone Article",
        translations: {},
      };

      const result = groupBlogPosts([postA, postB, postStandalone]);

      expect(result.series).toHaveLength(1);
      expect(result.series[0]?.name).toBe("My Series");
      expect(result.series[0]?.items).toHaveLength(2);
      expect(result.series[0]?.items[0]?.slug).toBe("ch-1");
      expect(result.series[0]?.items[1]?.slug).toBe("ch-2");

      expect(result.standalone).toHaveLength(1);
      expect(result.standalone[0]?.slug).toBe("standalone-article");
    });
  });
});
