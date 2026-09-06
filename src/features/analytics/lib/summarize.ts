export interface AnalyticsDailyRow {
  path: string;
  country: string;
  referrerHost: string;
  pageviews: number;
  visits: number;
}

export interface RankedCount {
  key: string;
  pageviews: number;
}

export interface AnalyticsSummary {
  pageviews: number;
  visits: number;
  countryCount: number;
  topPath: string | null;
  countries: RankedCount[];
  paths: RankedCount[];
  referrers: RankedCount[];
}

function rankByPageviews(
  counts: Map<string, number>,
  limit: number,
): RankedCount[] {
  return [...counts.entries()]
    .map(([key, pageviews]) => ({ key, pageviews }))
    .sort((a, b) => b.pageviews - a.pageviews || a.key.localeCompare(b.key))
    .slice(0, limit);
}

export function summarizeAnalyticsRows(
  rows: AnalyticsDailyRow[],
  limits: { countries?: number; paths?: number; referrers?: number } = {},
): AnalyticsSummary {
  const countryLimit = limits.countries ?? 12;
  const pathLimit = limits.paths ?? 10;
  const referrerLimit = limits.referrers ?? 8;

  const countries = new Map<string, number>();
  const paths = new Map<string, number>();
  const referrers = new Map<string, number>();
  let pageviews = 0;
  let visits = 0;

  for (const row of rows) {
    pageviews += row.pageviews;
    visits += row.visits;
    countries.set(
      row.country,
      (countries.get(row.country) ?? 0) + row.pageviews,
    );
    paths.set(row.path, (paths.get(row.path) ?? 0) + row.pageviews);
    referrers.set(
      row.referrerHost,
      (referrers.get(row.referrerHost) ?? 0) + row.pageviews,
    );
  }

  const rankedPaths = rankByPageviews(paths, pathLimit);
  const rankedCountries = rankByPageviews(countries, countryLimit);
  const rankedReferrers = rankByPageviews(referrers, referrerLimit).filter(
    (item) => item.key !== "direct",
  );

  return {
    pageviews,
    visits,
    countryCount: countries.size,
    topPath: rankedPaths[0]?.key ?? null,
    countries: rankedCountries,
    paths: rankedPaths,
    referrers: rankedReferrers,
  };
}

export function emptyAnalyticsSummary(): AnalyticsSummary {
  return {
    pageviews: 0,
    visits: 0,
    countryCount: 0,
    topPath: null,
    countries: [],
    paths: [],
    referrers: [],
  };
}
