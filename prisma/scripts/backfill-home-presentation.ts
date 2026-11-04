import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { z } from "zod";

config({ path: [".env.local", ".env"], quiet: true });
const localeMap = z.record(z.string(), z.string());
const seed = z
  .object({
    availableForWork: z.boolean(),
    careerNextTitle: localeMap,
    careerNextDescription: localeMap,
    contactResponseTime: localeMap,
  })
  .parse(
    JSON.parse(
      readFileSync(
        new URL("../data/portfolio-home.json", import.meta.url),
        "utf8",
      ),
    ),
  );
const profileSeed = z
  .object({ username: z.string() })
  .parse(
    JSON.parse(
      readFileSync(
        new URL("../data/portfolio-profile.json", import.meta.url),
        "utf8",
      ),
    ),
  );
const db = new PrismaClient();

try {
  const profile = await db.profile.findUnique({
    where: { username: profileSeed.username },
  });
  if (!profile) throw new Error("Seed profile not found; no data changed.");
  const header = await db.portfolioHeader.findUnique({
    where: { userId: profile.userId },
  });
  if (!header)
    throw new Error("Existing portfolio header not found; no data changed.");
  const languages = await db.appLanguage.findMany();
  let updated = 0;
  // A required Boolean cannot use Prisma's isSet filter. Guard the migration
  // atomically in MongoDB so an explicit admin false remains untouched.
  const availability = await db.$runCommandRaw({
    update: "PortfolioHeader",
    updates: [
      {
        q: { _id: { $oid: header.id }, availableForWork: { $exists: false } },
        u: { $set: { availableForWork: seed.availableForWork } },
      },
    ],
  });
  updated += z
    .object({ nModified: z.number().default(0) })
    .parse(availability).nModified;
  for (const language of languages) {
    const where = { portfolioHeaderId: header.id, appLanguageId: language.id };
    for (const field of [
      "careerNextTitle",
      "careerNextDescription",
      "contactResponseTime",
    ] as const) {
      const value = seed[field][language.code];
      if (!value) continue;
      const result = await db.portfolioHeaderTranslation.updateMany({
        where: { ...where, [field]: { isSet: false } },
        data: { [field]: value },
      });
      updated += result.count;
    }
  }
  console.log(
    `Home presentation: ${updated} missing fields populated for the seed profile.`,
  );
} finally {
  await db.$disconnect();
}
