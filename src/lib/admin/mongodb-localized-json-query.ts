import type { Prisma } from "@prisma/client";

const LOCALIZED_JSON_LOCALES = ["en", "es", "nl"] as const;

export type MongoSort = Record<string, 1 | -1>;

interface AggregateRawDelegate {
  aggregateRaw: (args: {
    pipeline: Prisma.InputJsonValue[];
  }) => Promise<unknown>;
}

export function escapeMongoRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mongoUserIdFilter(userId: string): { $oid: string } {
  return { $oid: userId };
}

/**
 * MongoDB `$or` match for localized JSON `{ default, translations?: { en, es, nl } }`.
 * Uses dot-notation paths — Prisma Json `path` filters are not available on MongoDB.
 */
export function buildLocalizedJsonTitleMongoMatch(
  field: string,
  searchStr: string | undefined,
): { $or: Record<string, unknown>[] } | undefined {
  if (!searchStr) return undefined;

  const regex = escapeMongoRegex(searchStr);
  const pattern = { $regex: regex, $options: "i" };

  return {
    $or: [
      { [`${field}.default`]: pattern },
      ...LOCALIZED_JSON_LOCALES.map((locale) => ({
        [`${field}.translations.${locale}`]: pattern,
      })),
    ],
  };
}

function parseAggregateIds(result: unknown): string[] {
  if (!Array.isArray(result)) return [];

  return result
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const id = (row as { _id?: { $oid?: string } })._id;
      return id?.$oid ?? null;
    })
    .filter((id): id is string => Boolean(id));
}

function parseAggregateCount(result: unknown): number {
  if (!Array.isArray(result) || result.length === 0) return 0;
  const row = result[0] as { total?: number };
  return typeof row.total === "number" ? row.total : 0;
}

export async function queryPaginatedIdsWithMongoMatch(options: {
  delegate: AggregateRawDelegate;
  match: Record<string, unknown>;
  sort: MongoSort;
  skip?: number;
  take?: number;
}): Promise<{ ids: string[]; totalCount: number }> {
  const { delegate, match, sort, skip = 0, take } = options;

  const dataPipeline: Prisma.InputJsonValue[] = [
    { $match: match as Prisma.InputJsonValue },
    { $sort: sort },
    ...(skip > 0 ? [{ $skip: skip }] : []),
    ...(take !== undefined ? [{ $limit: take }] : []),
    { $project: { _id: 1 } },
  ];

  const [dataResult, countResult] = await Promise.all([
    delegate.aggregateRaw({ pipeline: dataPipeline }),
    delegate.aggregateRaw({
      pipeline: [
        { $match: match as Prisma.InputJsonValue },
        { $count: "total" },
      ],
    }),
  ]);

  return {
    ids: parseAggregateIds(dataResult),
    totalCount: parseAggregateCount(countResult),
  };
}

export function reorderByIds<T extends { id: string }>(
  items: T[],
  ids: string[],
): T[] {
  const order = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
}
