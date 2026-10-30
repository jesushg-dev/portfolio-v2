import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PrismaClient,
  type Application,
  type JobSearch,
  type Prisma,
} from "@prisma/client";

const db = new PrismaClient();
const missingLink = {
  OR: [{ jobSearchId: null }, { jobSearchId: { isSet: false } }],
} satisfies Prisma.ApplicationWhereInput;

function planMigration(applications: Application[], searches: JobSearch[]) {
  const byUser = new Map<string, Application[]>();
  const searchesByUser = new Map<string, JobSearch[]>();
  const searchById = new Map(searches.map((search) => [search.id, search]));
  for (const search of searches) {
    searchesByUser.set(search.userId, [
      ...(searchesByUser.get(search.userId) ?? []),
      search,
    ]);
  }
  for (const userSearches of searchesByUser.values()) {
    if (userSearches.filter((search) => search.status === "OPEN").length > 1) {
      throw new Error("A user has multiple open searches");
    }
  }
  for (const application of applications) {
    byUser.set(application.userId, [
      ...(byUser.get(application.userId) ?? []),
      application,
    ]);
    if (application.jobSearchId) {
      const search = searchById.get(application.jobSearchId);
      if (search?.userId !== application.userId) {
        throw new Error(
          "An application references a missing or foreign search",
        );
      }
    }
  }

  const plan: {
    userId: string;
    ids: string[];
    startedAt: Date;
    openSearchId: string | null;
  }[] = [];
  for (const [userId, owned] of byUser) {
    const userSearches = searchesByUser.get(userId) ?? [];
    const open = userSearches.filter((search) => search.status === "OPEN");
    if (open.length > 1) throw new Error("A user has multiple open searches");
    const unassigned = owned.filter((application) => !application.jobSearchId);
    if (!unassigned.length) continue;
    if (!open.length && userSearches.length) {
      throw new Error(
        "Unassigned applications alongside closed searches require review",
      );
    }
    plan.push({
      userId,
      ids: unassigned.map((application) => application.id),
      startedAt: new Date(
        Math.min(
          ...unassigned.map((application) => application.appliedDate.getTime()),
        ),
      ),
      openSearchId: open[0]?.id ?? null,
    });
  }
  return plan;
}

async function retryConflict(operation: () => Promise<void>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      if (
        attempt === 2 ||
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "P2034"
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI ?? "";
  const expectedDatabase = process.argv
    .find((argument) => argument.startsWith("--expect-database="))
    ?.slice("--expect-database=".length);
  const configuredDatabase = uri
    ? decodeURIComponent(new URL(uri).pathname.slice(1))
    : "";
  if (apply && (!expectedDatabase || configuredDatabase !== expectedDatabase)) {
    throw new Error(
      "Refusing --apply: pass --expect-database with the exact configured database name",
    );
  }

  const [applications, searches] = await Promise.all([
    db.application.findMany(),
    db.jobSearch.findMany(),
  ]);
  const plan = planMigration(applications, searches);
  const unassignedCount = plan.reduce(
    (count, item) => count + item.ids.length,
    0,
  );
  console.log(
    `Applications: ${applications.length}; unassigned: ${unassignedCount}; users to migrate: ${plan.length}`,
  );
  if (!apply) {
    console.log("Dry run only. Pass --apply to write.");
    return;
  }

  const backupDir = join(process.cwd(), "scratch", "job-search-backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = join(
    backupDir,
    `before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        applications,
        jobSearches: searches,
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
  console.log(`Backup saved: ${backupPath}`);

  for (const item of plan) {
    await retryConflict(() =>
      db.$transaction(async (tx) => {
        const current = await tx.application.findMany({
          where: { userId: item.userId, id: { in: item.ids }, ...missingLink },
          select: { id: true },
        });
        if (current.length !== item.ids.length)
          throw new Error("Application links changed during migration");
        const open = await tx.jobSearch.findMany({
          where: { userId: item.userId, status: "OPEN" },
          select: { id: true },
        });
        if (
          open.length > 1 ||
          (item.openSearchId && open[0]?.id !== item.openSearchId)
        ) {
          throw new Error("Open search changed during migration");
        }
        let searchId = open[0]?.id;
        if (!searchId) {
          const created = await tx.jobSearch.create({
            data: {
              userId: item.userId,
              name: `Job search ${item.startedAt.getFullYear()}`,
              startedAt: item.startedAt,
              status: "OPEN",
            },
          });
          searchId = created.id;
        }
        const result = await tx.application.updateMany({
          where: { userId: item.userId, id: { in: item.ids }, ...missingLink },
          data: { jobSearchId: searchId },
        });
        if (result.count !== item.ids.length)
          throw new Error("Application count changed; transaction rolled back");
      }),
    );
  }

  const [afterApplications, afterSearches] = await Promise.all([
    db.application.findMany(),
    db.jobSearch.findMany(),
  ]);
  if (
    afterApplications.length !== applications.length ||
    afterApplications.some((application) => !application.jobSearchId)
  ) {
    throw new Error(
      "Verification failed: an application was lost or remains unassigned",
    );
  }
  planMigration(afterApplications, afterSearches);
  console.log(
    `Verified ${afterApplications.length} applications retained and linked.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
