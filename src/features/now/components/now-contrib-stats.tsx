"use client";
import { useLocale, useTranslations } from "next-intl";
import type { GitHubContributionStats } from "../lib/github-contributions";
import { languageColors } from "../lib/contribution-visuals";
export default function NowContribStats({
  stats,
}: {
  stats: GitHubContributionStats | null;
}) {
  const t = useTranslations("main.now.activity");
  const locale = useLocale();
  if (!stats)
    return (
      <p className="text-muted-foreground text-sm">{t("statsUnavailable")}</p>
    );
  const total = stats.languages.reduce((sum, item) => sum + item.bytes, 0);
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  return (
    <div className="min-w-0">
      <h3 className="text-muted-foreground mb-4 text-sm">
        {t("languageDistribution")}
      </h3>
      {total > 0 ? (
        <>
          <div
            className="flex h-1.5 gap-0.5 overflow-hidden rounded-full"
            aria-hidden
          >
            {stats.languages.map((language, index) => (
              <span
                key={language.name}
                style={{
                  width: String((language.bytes / total) * 100) + "%",
                  backgroundColor:
                    languageColors[index % languageColors.length],
                }}
              />
            ))}
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-sm">
            {stats.languages.map((language, index) => (
              <li key={language.name} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      languageColors[index % languageColors.length],
                  }}
                />
                <span>
                  {language.name === "__other__"
                    ? t("otherLanguages")
                    : language.name}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {percent.format(language.bytes / total)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{t("noLanguageData")}</p>
      )}
      <p className="text-muted-foreground mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>
          {t("githubStars", { count: stats.stars.toLocaleString(locale) })}
        </span>
        <span>
          {t("githubForks", { count: stats.forks.toLocaleString(locale) })}
        </span>
        <span>
          {stats.activity.issues.toLocaleString(locale)} {t("activityIssues")}
        </span>
        <span>
          {stats.activity.reviews.toLocaleString(locale)} {t("activityReviews")}
        </span>
      </p>
      <p className="text-muted-foreground mt-2 max-w-[70ch] text-xs leading-relaxed">
        {t("repositorySample", {
          sampled: stats.sampledRepositories,
          total: stats.totalRepositories,
        })}
      </p>
    </div>
  );
}
