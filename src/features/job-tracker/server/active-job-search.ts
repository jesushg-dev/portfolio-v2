import type { JobSearch, PrismaClient } from "@prisma/client";

type JobSearchDb = PrismaClient;
const pendingSearches = new Map<string, Promise<JobSearch | null>>();

/** Reads never migrate historical data. Run the backed-up migration before deployment. */
export function getOpenJobSearch(
  db: JobSearchDb,
  userId: string,
  createIfMissing = false,
): Promise<JobSearch | null> {
  const key = `${userId}:${createIfMissing}`;
  const pending = pendingSearches.get(key);
  if (pending) return pending;
  const request = loadOpenJobSearch(db, userId, createIfMissing);
  pendingSearches.set(key, request);
  void request
    .finally(() => {
      if (pendingSearches.get(key) === request) pendingSearches.delete(key);
    })
    .catch(() => undefined);
  return request;
}

async function loadOpenJobSearch(
  db: JobSearchDb,
  userId: string,
  createIfMissing: boolean,
): Promise<JobSearch | null> {
  const unassigned = await db.application.findFirst({
    where: {
      userId,
      OR: [{ jobSearchId: null }, { jobSearchId: { isSet: false } }],
    },
    select: { id: true },
  });
  if (unassigned) {
    throw new Error(
      "JobSearch migration required: existing applications are not assigned to a search",
    );
  }
  const openSearches = await db.jobSearch.findMany({
    where: { userId, status: "OPEN" },
    orderBy: { startedAt: "desc" },
    take: 2,
  });
  if (openSearches.length > 1)
    throw new Error("A user has multiple open job searches");
  const open = openSearches[0] ?? null;
  if (open || !createIfMissing) return open;
  return (await startNewJobSearch(db, userId)).search;
}

/** A write to User serializes concurrent starts for the same owner. */
export async function startNewJobSearch(
  db: JobSearchDb,
  userId: string,
  name?: string,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { updatedAt: new Date() },
        });
        const open = await tx.jobSearch.findFirst({
          where: { userId, status: "OPEN" },
        });
        if (open) return { search: open, created: false };
        const startedAt = new Date();
        const search = await tx.jobSearch.create({
          data: {
            userId,
            name: name ?? `Job search ${startedAt.getFullYear()}`,
            startedAt,
            status: "OPEN",
          },
        });
        return { search, created: true };
      });
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
  throw new Error("Job search write conflict retry exhausted");
}
