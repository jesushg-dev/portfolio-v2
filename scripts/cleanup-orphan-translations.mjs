/**
 * Cleans up invalid or duplicate records that violate unique indexes before `prisma db push`.
 */
import { PrismaClient } from "@prisma/client";

async function deduplicateCollection(prisma, collection, fieldA, fieldB) {
  try {
    const raw = await prisma.$runCommandRaw({
      aggregate: collection,
      pipeline: [
        {
          $match: {
            [fieldA]: { $ne: null, $exists: true },
            [fieldB]: { $ne: null, $exists: true },
          },
        },
        {
          $group: {
            _id: { a: `$${fieldA}`, b: `$${fieldB}` },
            ids: { $push: "$_id" },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ],
      cursor: {},
    });

    const groups = raw?.cursor?.firstBatch || [];
    const idsToDelete = [];

    for (const group of groups) {
      if (Array.isArray(group.ids) && group.ids.length > 1) {
        // Keep the first (or last) one, delete the rest
        const toDelete = group.ids.slice(1);
        idsToDelete.push(...toDelete);
      }
    }

    if (idsToDelete.length > 0) {
      const res = await prisma.$runCommandRaw({
        delete: collection,
        deletes: [
          {
            q: { _id: { $in: idsToDelete } },
            limit: 0,
          },
        ],
      });
      console.log(`[db:prep] Deduplicated ${collection}: removed ${idsToDelete.length} duplicates`, res);
    }
  } catch (err) {
    console.warn(`[db:prep] Deduplication check on ${collection} skipped:`, err?.message ?? err);
  }
}

export async function cleanupOrphanRecords() {
  const prisma = new PrismaClient();
  try {
    // 1. Remove ProjectTranslation with null or missing projectId or appLanguageId
    const resProject = await prisma.$runCommandRaw({
      delete: "ProjectTranslation",
      deletes: [
        {
          q: {
            $or: [
              { projectId: null },
              { projectId: { $exists: false } },
              { appLanguageId: null },
              { appLanguageId: { $exists: false } },
            ],
          },
          limit: 0,
        },
      ],
    });
    console.log("[db:prep] Cleaned invalid ProjectTranslation records:", resProject);

    // 2. Remove TimelineItemSkill with null or missing timelineItemId or skillId
    const resTimeline = await prisma.$runCommandRaw({
      delete: "TimelineItemSkill",
      deletes: [
        {
          q: {
            $or: [
              { timelineItemId: null },
              { timelineItemId: { $exists: false } },
              { skillId: null },
              { skillId: { $exists: false } },
            ],
          },
          limit: 0,
        },
      ],
    });
    console.log("[db:prep] Cleaned invalid TimelineItemSkill records:", resTimeline);

    // 3. Deduplicate ProjectTranslation (projectId, appLanguageId)
    await deduplicateCollection(prisma, "ProjectTranslation", "projectId", "appLanguageId");

    // 4. Deduplicate TimelineItemSkill (timelineItemId, skillId)
    await deduplicateCollection(prisma, "TimelineItemSkill", "timelineItemId", "skillId");
  } catch (error) {
    console.warn("[db:prep] Warning during pre-push cleanup:", error?.message ?? error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (process.argv[1]?.endsWith("cleanup-orphan-translations.mjs")) {
  cleanupOrphanRecords();
}
