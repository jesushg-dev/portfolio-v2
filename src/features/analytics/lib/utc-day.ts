const RETENTION_MONTHS = 13;

export function utcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function utcDaysAgo(days: number, from = new Date()): Date {
  const start = utcDay(from);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

export function analyticsRetentionCutoff(from = new Date()): Date {
  const cutoff = utcDay(from);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);
  return cutoff;
}
