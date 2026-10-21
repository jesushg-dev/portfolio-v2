import { isSkippedAnalyticsPath } from "@/features/analytics/lib/analytics-path";

const BOT_UA_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|redditbot|slackbot|telegrambot|whatsapp|preview|monitor|headless|lighthouse|pagespeed|gtmetrix|pingdom|ahrefs|semrush|dotbot|bytespider|gptbot|claudebot|ccbot|amazonbot|yandex|baidu|duckduck|ia_archiver|wget|curl|python-requests|go-http-client/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return true;
  return BOT_UA_RE.test(ua);
}

export function hasDoNotTrack(
  dnt: string | null | undefined,
  gpc: string | null | undefined,
): boolean {
  const dntValue = dnt?.trim().toLowerCase();
  if (dntValue === "1" || dntValue === "yes") return true;
  return gpc?.trim() === "1";
}

export function shouldSkipCollect(input: {
  dnt?: string | null;
  gpc?: string | null;
  userAgent?: string | null;
  analyticsPath: string;
  isOwner: boolean;
}): boolean {
  if (input.isOwner) return true;
  if (hasDoNotTrack(input.dnt, input.gpc)) return true;
  if (isBotUserAgent(input.userAgent)) return true;
  return isSkippedAnalyticsPath(input.analyticsPath);
}
