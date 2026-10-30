import "dotenv/config";
import { PrismaClient, CvSkillCategory } from "@prisma/client";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ensureCvSkillIds,
  normalizeSkillTitle,
} from "../../src/features/cv/lib/cv-skill-catalog";

const db = new PrismaClient();
const oid = z.object({ $oid: z.string() });
const schema = z.array(
  z
    .object({
      _id: oid,
      userId: oid,
      category: z.nativeEnum(CvSkillCategory),
      items: z.array(z.string()).optional(),
    })
    .passthrough(),
);
try {
  const database = new URL(process.env.MONGODB_URI ?? "").pathname.slice(1);
  const apply = process.argv.includes("--apply");
  if (apply && !process.argv.includes(`--expect-database=${database}`))
    throw new Error("Specify the exact target database");
  const [raw, skills, selections] = await Promise.all([
    db.cvTechnicalSkill.findRaw(),
    db.skill.findMany(),
    db.cvTechnicalSkillSelection.findMany(),
  ]);
  const groups = schema.parse(raw);
  const missing = groups.flatMap((group) =>
    (group.items ?? [])
      .filter(
        (title) =>
          !skills.some(
            (skill) =>
              skill.userId === group.userId.$oid &&
              normalizeSkillTitle(skill.title) === normalizeSkillTitle(title),
          ),
      )
      .map((title) => ({
        userId: group.userId.$oid,
        title,
        category: group.category,
      })),
  );
  console.log(
    JSON.stringify({
      database,
      apply,
      groups: groups.length,
      selections: selections.length,
      missingCatalogueEntries: missing,
    }),
  );
  if (apply) {
    const directory = path.resolve("scratch/cv-skill-catalog-backups");
    await mkdir(directory, { recursive: true });
    const backup = path.join(
      directory,
      new Date().toISOString().replace(/[:.]/g, "-") + ".json",
    );
    await writeFile(
      backup,
      JSON.stringify({ database, groups: raw, skills, selections }, null, 2),
      { flag: "wx" },
    );
    console.log(JSON.stringify({ backup }));
    for (const group of groups)
      await db.$transaction(async (tx) => {
        const groupId = group._id.$oid;
        const existing = await tx.cvTechnicalSkillSelection.count({
          where: { cvTechnicalSkillId: groupId },
        });
        if (group.items && existing === 0) {
          const ids = await ensureCvSkillIds(
            tx,
            group.userId.$oid,
            group.items,
            group.category,
          );
          for (const [order, skillId] of ids.entries())
            await tx.cvTechnicalSkillSelection.create({
              data: {
                cvTechnicalSkillId: groupId,
                skillId,
                visible: true,
                order,
              },
            });
        }
        if (process.argv.includes("--purge-source-fields"))
          await tx.$runCommandRaw({
            update: "CvTechnicalSkill",
            updates: [
              { q: { _id: { $oid: groupId } }, u: { $unset: { items: "" } } },
            ],
          });
      });
    const after = await db.cvTechnicalSkill.count();
    if (after !== groups.length)
      throw new Error("CV skill group counts changed unexpectedly");
    console.log(
      JSON.stringify({
        groupsRetained: after,
        selections: await db.cvTechnicalSkillSelection.count(),
        catalogueSkills: await db.skill.count(),
      }),
    );
  }
} finally {
  await db.$disconnect();
}
