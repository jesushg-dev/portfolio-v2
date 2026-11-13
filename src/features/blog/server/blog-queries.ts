import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyBlogPostCreateDto,
  groupBlogPosts,
  mapBlogPostToEditorDto,
  mapBlogPostsToEditorDto,
  resolveSeriesTitle,
} from "@/features/blog/lib/blog-editor-dto";

export async function getBlogCreatePageData(
  prefillSeries?: string,
  locale?: string,
) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const series = await db.blogSeries.findMany({
    where: { userId },
    include: { translations: true },
    orderBy: { slug: "asc" },
  });

  return {
    initialData: buildEmptyBlogPostCreateDto(languages, prefillSeries),
    languages,
    availableSeries: series.map((s) => ({
      slug: s.slug,
      title: resolveSeriesTitle(s, languages, locale),
    })),
  };
}

export async function getBlogEditPageData(id: string, locale?: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const [post, series] = await Promise.all([
    db.blogPost.findUnique({
      where: { id, userId },
      include: {
        translations: true,
        series: { include: { translations: true } },
      },
    }),
    db.blogSeries.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  if (!post) return null;

  return {
    editorDto: mapBlogPostToEditorDto(post, languages, locale),
    languages,
    availableSeries: series.map((s) => ({
      slug: s.slug,
      title: resolveSeriesTitle(s, languages, locale),
    })),
  };
}

export async function getUserBlogPosts(locale?: string) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const posts = await db.blogPost.findMany({
    where: { userId },
    include: {
      translations: true,
      series: { include: { translations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const editorPosts = mapBlogPostsToEditorDto(posts, languages, locale);
  const { series, standalone } = groupBlogPosts(editorPosts);

  return {
    data: editorPosts,
    series,
    standalone,
    languages,
  };
}
