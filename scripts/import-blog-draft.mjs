import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const draftsDir = path.resolve(__dirname, "../prisma/data/blog-drafts");

const args = process.argv.slice(2);
const emailFlag = args.indexOf("--email");
const email = emailFlag >= 0 ? args[emailFlag + 1] : undefined;
const fileFlag = args.indexOf("--file");
const specifiedFile = fileFlag >= 0 ? args[fileFlag + 1] : undefined;
const write = args.includes("--write");

async function getDraftFiles() {
  if (specifiedFile) {
    return [path.resolve(process.cwd(), specifiedFile)];
  }
  const files = await readdir(draftsDir);
  return files
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(draftsDir, f));
}

const filePaths = await getDraftFiles();
if (filePaths.length === 0) {
  throw new Error("No draft JSON files found.");
}

const drafts = [];
for (const fp of filePaths) {
  const content = JSON.parse(await readFile(fp, "utf8"));
  if (content.content?.type !== "doc") {
    throw new Error(`Expected Tiptap doc structure in ${path.basename(fp)}`);
  }
  drafts.push({ ...content, _filePath: fp });
}

if (!write) {
  console.log(`Validated ${drafts.length} draft(s). No database connection or writes:`);
  for (const d of drafts) {
    const seriesInfo = d.seriesName ? ` [Series: "${d.seriesName}" #${d.seriesOrder}]` : "";
    const imgCount = d.content.content ? d.content.content.filter((c) => c.type === "image").length : 0;
    const imgInfo = imgCount > 0 ? ` (${imgCount} images)` : "";
    console.log(`  ✔ ${d.slug} (${d.locale}, ${d.status}, date: ${d.createdAt ?? "now"})${seriesInfo}${imgInfo}`);
  }
} else {
  if (!email || email.startsWith("--")) {
    throw new Error("--write requires --email for the exact owner.");
  }
  await import("dotenv/config");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`Owner with email ${email} not found.`);
    }

    console.log(`Importing ${drafts.length} draft(s) for owner: ${email}...`);

    for (const d of drafts) {
      const language = await prisma.appLanguage.findUnique({
        where: { code: d.locale },
      });
      if (!language) {
        console.warn(`Language '${d.locale}' not found in database. Skipping ${d.slug}.`);
        continue;
      }

      const existing = await prisma.blogPost.findUnique({
        where: { userId_slug: { userId: user.id, slug: d.slug } },
        select: { id: true },
      });

      if (existing) {
        console.log(`  ℹ Post already exists; preserving existing content for: ${d.slug}`);
      } else {
        await prisma.blogPost.create({
          data: {
            userId: user.id,
            slug: d.slug,
            tags: d.tags ?? [],
            coverImage: d.coverImage ?? null,
            seriesName: d.seriesName ?? null,
            seriesOrder: d.seriesOrder ?? null,
            status: d.status ?? "DRAFT",
            publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
            createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
            translations: {
              create: {
                appLanguageId: language.id,
                title: d.title,
                excerpt: d.excerpt,
                content: JSON.stringify(d.content),
              },
            },
          },
        });
        console.log(`  ✔ Created: ${d.slug} (${d.status}, date: ${d.createdAt ?? "now"})`);
      }
    }
    console.log("Import process completed.");
  } finally {
    await prisma.$disconnect();
  }
}
