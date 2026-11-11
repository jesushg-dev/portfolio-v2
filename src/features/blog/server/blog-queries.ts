import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyBlogPostCreateDto,
  mapBlogPostToEditorDto,
  mapBlogPostsToEditorDto,
} from "@/features/blog/lib/blog-editor-dto";

export async function getBlogCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyBlogPostCreateDto(languages),
    languages,
  };
}

export async function getBlogEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const post = await db.blogPost.findUnique({
    where: { id, userId },
    include: { translations: true },
  });

  if (!post) return null;

  return {
    editorDto: mapBlogPostToEditorDto(post, languages),
    languages,
  };
}

export async function getUserBlogPosts() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const posts = await db.blogPost.findMany({
    where: { userId },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: mapBlogPostsToEditorDto(posts, languages),
    languages,
  };
}
