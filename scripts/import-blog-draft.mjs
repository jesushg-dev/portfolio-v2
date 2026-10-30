import { readFile } from "node:fs/promises";

const draft = JSON.parse(
  await readFile(
    new URL(
      "../prisma/data/blog-drafts/monitor-titulo-la-gaceta-nicaragua.es.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

if (
  draft.status !== "DRAFT" ||
  draft.publishedAt !== null ||
  draft.content?.type !== "doc"
) {
  throw new Error("Expected an unpublished Tiptap draft.");
}

const args = process.argv.slice(2);
const emailFlag = args.indexOf("--email");
const email = emailFlag >= 0 ? args[emailFlag + 1] : undefined;
const write = args.includes("--write");
if (
  args.some(
    (arg, index) =>
      !["--write", "--email"].includes(arg) &&
      !(emailFlag >= 0 && index === emailFlag + 1),
  )
) {
  throw new Error(
    "Usage: node scripts/import-blog-draft.mjs [--write --email owner@example.com]",
  );
}

if (!write) {
  console.log(
    `Validated draft: ${draft.slug} (${draft.locale}). No database connection or writes.`,
  );
} else {
  if (!email || email.startsWith("--"))
    throw new Error("--write requires --email for the exact owner.");
  await import("dotenv/config");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const language = await prisma.appLanguage.findUnique({
      where: { code: draft.locale },
    });
    if (!user || !language)
      throw new Error(
        "Owner or Spanish language not found. Nothing was imported.",
      );
    const existing = await prisma.blogPost.findUnique({
      where: { userId_slug: { userId: user.id, slug: draft.slug } },
      select: { id: true },
    });
    if (existing) {
      console.log(
        "Post already exists; preserving its content and publication status.",
      );
    } else {
      await prisma.blogPost.create({
        data: {
          userId: user.id,
          slug: draft.slug,
          tags: draft.tags,
          coverImage: draft.coverImage,
          status: "DRAFT",
          publishedAt: null,
          translations: {
            create: {
              appLanguageId: language.id,
              title: draft.title,
              excerpt: draft.excerpt,
              content: JSON.stringify(draft.content),
            },
          },
        },
      });
      console.log("Spanish draft imported. It remains unpublished.");
    }
  } finally {
    await prisma.$disconnect();
  }
}
