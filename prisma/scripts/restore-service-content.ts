import { config } from "dotenv";
import { readFileSync } from "node:fs";
config({ path: [".env.local", ".env"], quiet: true });
import { PrismaClient } from "@prisma/client";
import { seedPortfolioServices } from "../seed-portfolio-services";

const prisma = new PrismaClient();
async function main() {
  const profile = JSON.parse(
    readFileSync(
      new URL("../data/portfolio-profile.json", import.meta.url),
      "utf8",
    ),
  ) as { username: string };
  const owner = await prisma.profile.findUnique({
    where: { username: profile.username },
    select: { userId: true },
  });
  if (!owner) throw new Error("The seeded portfolio owner does not exist.");
  const languages = await prisma.appLanguage.findMany({
    select: { id: true, code: true },
  });
  const es = languages.find((language) => language.code === "es")?.id;
  const en = languages.find((language) => language.code === "en")?.id;
  const nl = languages.find((language) => language.code === "nl")?.id;
  if (!es || !en || !nl)
    throw new Error(
      "The existing Spanish, English and Dutch languages are required.",
    );
  const before = await prisma.service.findMany({
    where: { userId: owner.userId },
    include: { ServiceTranslation: true, ServiceSkill: true },
  });
  const records = await seedPortfolioServices(
    prisma,
    { es, en, nl },
    owner.userId,
  );
  const after = await prisma.service.findMany({
    where: { userId: owner.userId },
    include: { ServiceTranslation: true, ServiceSkill: true },
  });
  const beforeById = new Map(
    before.map((service) => [service.id, JSON.stringify(service)]),
  );
  const created = after.filter((service) => !beforeById.has(service.id)).length;
  const updated = after.filter(
    (service) =>
      beforeById.has(service.id) &&
      beforeById.get(service.id) !== JSON.stringify(service),
  ).length;
  console.log(
    `Checked ${Object.keys(records).length} curated owner services: ${created} created, ${updated} updated. Other owners and existing edited details preserved.`,
  );
}
main()
  .catch(() => {
    console.error(
      "Service content import failed. Check database connectivity and the configured owner.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
