"use client";
import { useLocale, useTranslations } from "next-intl";
import type { GitHubActivity } from "../lib/github-activity";

export function NowGithubActivity({ activity }: { activity: GitHubActivity }) {
  const t = useTranslations("main.now.activity");
  const locale = useLocale();
  if (activity.status !== "ready")
    return (
      <div className="text-muted-foreground text-sm">
        <p>
          {t(
            activity.status === "empty"
              ? "githubNoActivity"
              : "githubUnavailable",
          )}
        </p>
        {activity.username ? (
          <a
            href={"https://github.com/" + encodeURIComponent(activity.username)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-2 inline-block hover:underline"
          >
            {t("githubProfile")}
          </a>
        ) : null}
      </div>
    );
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-foreground text-lg leading-relaxed">
        {t(`githubEvent.${activity.event.kind}`)}{" "}
        <a
          href={activity.event.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold break-words hover:underline"
        >
          {activity.event.repository}
        </a>
      </p>
      <time
        dateTime={activity.event.createdAt}
        className="text-muted-foreground mt-2 block font-mono text-xs"
      >
        {new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(new Date(activity.event.createdAt))}{" "}
        UTC
      </time>
    </div>
  );
}
