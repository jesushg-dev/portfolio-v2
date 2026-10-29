"use client";
import { Suspense, useId, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Blocks, CalendarDays, ExternalLink, Gamepad2 } from "lucide-react";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import type { GitHubContributions } from "../lib/github-contributions";

const NowContribBlocks = dynamic(() => import("./now-contrib-blocks"));
const NowContribCalendar = dynamic(() => import("./now-contrib-calendar"));
const NowContribBreakout = dynamic(() => import("./now-contrib-breakout"));
const NowContribStats = dynamic(() => import("./now-contrib-stats"));
function ContributionLoading() {
  const t = useTranslations("main.now.activity");
  return <div role="status" className="bg-muted/40 text-muted-foreground flex min-h-72 items-center justify-center rounded-xl p-6 text-sm">{t("loadingVisualization")}</div>;
}
export function NowContribGraph({ calendar }: { calendar: GitHubContributions }) {
  const locale = useLocale();
  const t = useTranslations("main.now.activity");
  const [view, setView] = useState(0);
  const id = useId();
  const panelId = id + "-panel";
  if (calendar.status !== "ready") return <div className="text-muted-foreground text-sm">
    <p>{t("githubUnavailable")}</p>
    {calendar.username ? <a className="text-primary mt-2 inline-flex items-center gap-2 hover:underline"
      href={"https://github.com/" + encodeURIComponent(calendar.username)} target="_blank" rel="noopener noreferrer">
      {t("githubProfile")}<ExternalLink aria-hidden className="size-3.5" />
    </a> : null}
  </div>;
  const metrics = [
    { label: t("contributionCount"), value: calendar.total },
    ...(calendar.stats ? [
      { label: t("activityCommits"), value: calendar.stats.activity.commits },
      { label: t("activityPullRequests"), value: calendar.stats.activity.pullRequests },
      { label: t("activityRepositories"), value: calendar.stats.activity.repositories },
    ] : []),
  ];
  return (
    <div className="w-full min-w-0">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
        {metrics.map((metric) => <div key={metric.label} className="flex min-w-0 flex-col">
          <dt className="text-muted-foreground mt-2 text-sm">{metric.label}</dt>
          <dd className="text-foreground order-first font-mono text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-semibold tracking-tighter">{metric.value.toLocaleString(locale)}</dd>
        </div>)}
      </dl>
      <div className="mt-16 space-y-6 md:mt-20">
        <div className="flex min-w-0 justify-center">
          <Tab tabId={id} currentTab={view} setCurrentTab={setView} ariaLabel={t("contributionViews")} className="max-w-full">
            <TabItem icon={Blocks} title={t("blocks")} panelId={panelId} />
            <TabItem icon={CalendarDays} title={t("calendar")} panelId={panelId} />
            <TabItem icon={Gamepad2} title={t("breakout")} panelId={panelId} />
          </Tab>
        </div>
        <p className="text-muted-foreground text-center text-sm">{t("contributionsTotal", { total: calendar.total.toLocaleString(locale) })}</p>
        <div id={panelId} role="tabpanel" aria-labelledby={id + "-tab-" + view} tabIndex={0}
          className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Suspense fallback={<ContributionLoading />}>
            {view === 0 ? <NowContribBlocks calendar={calendar} /> : null}
            {view === 1 ? <NowContribCalendar calendar={calendar} /> : null}
            {view === 2 ? <NowContribBreakout key={calendar.username} calendar={calendar} /> : null}
          </Suspense>
        </div>
      </div>
      <div className="mt-16">
        <Suspense fallback={<ContributionLoading />}><NowContribStats stats={calendar.stats} /></Suspense>
      </div>
    </div>
  );
}
