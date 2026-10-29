import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const publicFields = [
  "heroSubtitle",
  "heroTagline",
  "heroSummary",
  "portfolioAbout",
] as const;
const oid = z.object({ $oid: z.string() });
const translationSchema = z
  .object({
    _id: oid,
    cvHeaderId: oid.nullish(),
    appLanguageId: oid,
    heroSubtitle: z.string().nullish(),
    heroTagline: z.string().nullish(),
    heroSummary: z.string().nullish(),
    portfolioAbout: z.string().nullish(),
    availabilityBadge: z.string().nullish(),
    clientImageAlt: z.string().nullish(),
  })
  .passthrough();

try {
  const database = new URL(process.env.MONGODB_URI ?? "").pathname.slice(1);
  const apply = process.argv.includes("--apply");
  const purge = process.argv.includes("--purge-source-fields");
  if (apply && !process.argv.includes(`--expect-database=${database}`))
    throw new Error("Specify the exact target database with --expect-database");
  const [headers, raw, existing] = await Promise.all([
    db.cvHeader.findMany(),
    db.cvHeaderTranslation.findRaw(),
    db.portfolioHeader.findMany({ include: { translations: true } }),
  ]);
  const translations = z.array(translationSchema).parse(raw);
  console.log(
    JSON.stringify({
      database,
      apply,
      headers: headers.length,
      translations: translations.length,
      existingPublicHeaders: existing.length,
    }),
  );
  if (apply) {
    const directory = path.resolve("scratch/portfolio-profile-backups");
    await mkdir(directory, { recursive: true });
    const backup = path.join(
      directory,
      new Date().toISOString().replace(/[:.]/g, "-") + ".json",
    );
    await writeFile(
      backup,
      JSON.stringify(
        { database, headers, translations: raw, existing },
        null,
        2,
      ),
      { flag: "wx" },
    );
    console.log(JSON.stringify({ backup }));
    for (const header of headers)
      await db.$transaction(async (tx) => {
        const publicHeader = await tx.portfolioHeader.upsert({
          where: { userId: header.userId },
          update: {},
          create: {
            userId: header.userId,
            fullName: header.fullName,
            photoUrl: header.photoUrl,
            backgroundImageUrl: header.backgroundImageUrl,
          },
        });
        for (const translation of translations.filter(
          (item) => item.cvHeaderId?.$oid === header.id,
        )) {
          const data = {
            heroSubtitle: translation.heroSubtitle ?? null,
            heroTagline: translation.heroTagline ?? null,
            heroSummary: translation.heroSummary ?? null,
            portfolioAbout: translation.portfolioAbout ?? null,
            availabilityBadge: translation.availabilityBadge ?? null,
            clientImageAlt: translation.clientImageAlt ?? null,
          };
          const saved = await tx.portfolioHeaderTranslation.upsert({
            where: {
              portfolioHeaderId_appLanguageId: {
                portfolioHeaderId: publicHeader.id,
                appLanguageId: translation.appLanguageId.$oid,
              },
            },
            update: {},
            create: {
              portfolioHeaderId: publicHeader.id,
              appLanguageId: translation.appLanguageId.$oid,
              ...data,
            },
          });
          const wasPresent = existing.some(
            (item) =>
              item.id === publicHeader.id &&
              item.translations.some((row) => row.id === saved.id),
          );
          if (
            !wasPresent &&
            Object.entries(data).some(
              ([key, value]) => saved[key as keyof typeof data] !== value,
            )
          )
            throw new Error("Public translation copy verification failed");
          // Purge after deployment: the previous deployed app still reads these fields.
          if (purge)
            await tx.$runCommandRaw({
              update: "CvHeaderTranslation",
              updates: [
                {
                  q: { _id: { $oid: translation._id.$oid } },
                  u: {
                    $unset: Object.fromEntries(
                      publicFields.map((key) => [key, ""]),
                    ),
                  },
                },
              ],
            });
        }
      });
    const [afterHeaders, afterCvTranslations] = await Promise.all([
      db.cvHeader.count(),
      db.cvHeaderTranslation.count(),
    ]);
    if (
      afterHeaders !== headers.length ||
      afterCvTranslations !== translations.length
    )
      throw new Error("CV record counts changed unexpectedly");
    console.log(
      JSON.stringify({
        cvHeadersRetained: afterHeaders,
        cvTranslationsRetained: afterCvTranslations,
        publicHeaders: await db.portfolioHeader.count(),
      }),
    );
  }
} finally {
  await db.$disconnect();
}
