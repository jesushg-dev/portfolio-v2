export interface AnalyticsDailyRow {
  date?: Date;
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

export interface DailyVisitPoint {
  date: string;
  visits: number;
}

export interface AnalyticsSummary {
  pageviews: number;
  visits: number;
  countryCount: number;
  topPath: string | null;
  countries: RankedCount[];
  unknownCountryPageviews: number;
  unknownCountryPercent: number;
  otherCountriesCount: number;
  otherCountriesPageviews: number;
  paths: RankedCount[];
  referrers: RankedCount[];
  dailyVisits: DailyVisitPoint[];
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
  const countryLimit = limits.countries ?? 5;
  const pathLimit = limits.paths ?? 10;
  const referrerLimit = limits.referrers ?? 8;

  const countries = new Map<string, number>();
  const paths = new Map<string, number>();
  const referrers = new Map<string, number>();
  let pageviews = 0;
  let visits = 0;
  let unknownCountryPageviews = 0;

  for (const row of rows) {
    pageviews += row.pageviews;
    visits += row.visits;

    const isUnknownCountry =
      !row.country ||
      row.country === "XX" ||
      row.country.toLowerCase() === "unknown";

    if (isUnknownCountry) {
      unknownCountryPageviews += row.pageviews;
    } else {
      countries.set(
        row.country,
        (countries.get(row.country) ?? 0) + row.pageviews,
      );
    }

    paths.set(row.path, (paths.get(row.path) ?? 0) + row.pageviews);
    referrers.set(
      row.referrerHost,
      (referrers.get(row.referrerHost) ?? 0) + row.pageviews,
    );
  }

  const allRankedCountries = rankByPageviews(countries, countries.size);
  const topCountries = allRankedCountries.slice(0, countryLimit);
  const restCountries = allRankedCountries.slice(countryLimit);

  const otherCountriesCount = restCountries.length;
  const otherCountriesPageviews = restCountries.reduce(
    (sum, c) => sum + c.pageviews,
    0,
  );

  const rankedCountries: RankedCount[] = [...topCountries];
  if (otherCountriesCount > 0) {
    rankedCountries.push({
      key: `OTHER:${otherCountriesCount}`,
      pageviews: otherCountriesPageviews,
    });
  }

  const rankedPaths = rankByPageviews(paths, pathLimit);
  const rankedReferrers = rankByPageviews(referrers, referrerLimit).filter(
    (item) => item.key !== "direct",
  );

  const unknownCountryPercent =
    pageviews > 0 ? Math.round((unknownCountryPageviews / pageviews) * 100) : 0;

  return {
    pageviews,
    visits,
    countryCount: countries.size,
    topPath: rankedPaths[0]?.key ?? null,
    countries: rankedCountries,
    unknownCountryPageviews,
    unknownCountryPercent,
    otherCountriesCount,
    otherCountriesPageviews,
    paths: rankedPaths,
    referrers: rankedReferrers,
    dailyVisits: [],
  };
}

export function emptyAnalyticsSummary(): AnalyticsSummary {
  return {
    pageviews: 0,
    visits: 0,
    countryCount: 0,
    topPath: null,
    countries: [],
    unknownCountryPageviews: 0,
    unknownCountryPercent: 0,
    otherCountriesCount: 0,
    otherCountriesPageviews: 0,
    paths: [],
    referrers: [],
    dailyVisits: [],
  };
}
