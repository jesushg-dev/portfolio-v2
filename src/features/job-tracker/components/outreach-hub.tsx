"use client";

import { useMemo, useState, type FC } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { statusVariants } from "@/features/job-tracker/lib/constants";
import { parseEmailClient } from "@/features/job-tracker/lib/parse-email-client";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type HubData = RouterOutputs["jobTrackerAdmin"]["getEmailTrackingHub"];
type HubApplication = HubData["applications"][number];
type HubEmail = HubApplication["emails"][number];
type HubFilter = "all" | "opened" | "unopened";
type TranslationFn = ReturnType<typeof useTranslations<"admin.jobTracker">>;

export const OutreachHub: FC = () => {
  const t = useTranslations("admin.jobTracker");
  const locale = useLocale() as Locale;
  const dateFnsLocale = getDateFnsLocale(locale);

  const { data, isLoading, isError, isFetching, refetch } =
    api.jobTrackerAdmin.getEmailTrackingHub.useQuery(undefined, {
      refetchInterval: 30_000,
    });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HubFilter>("all");

  const filteredApplications = useMemo(() => {
    if (!data?.applications) return [];

    return data.applications.filter((app) => {
      // Filter by category
      if (activeFilter === "opened" && app.totalOpens === 0) return false;
      if (activeFilter === "unopened" && app.totalOpens > 0) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCompany = app.company.name.toLowerCase().includes(query);
        const matchesPosition = app.position.toLowerCase().includes(query);
        const matchesRecipient = app.emails.some((e) =>
          e.recipientEmail.toLowerCase().includes(query),
        );
        if (!matchesCompany && !matchesPosition && !matchesRecipient) {
          return false;
        }
      }

      return true;
    });
  }, [data?.applications, activeFilter, searchQuery]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
            {t("outreachHub.title")}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {t("outreachHub.description")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="gap-2"
        >
          {isFetching ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-3.5" aria-hidden />
          )}
          {t("outreachHub.refresh")}
        </Button>
      </header>

      {/* Stats Bar */}
      <OutreachStatsBar stats={data?.stats} t={t} isLoading={isLoading} />

      {/* Filter and Search Bar */}
      <OutreachFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        t={t}
      />

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <Loader2 className="text-primary size-8 animate-spin" />
        </div>
      ) : isError ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
          Failed to load outreach metrics.
        </div>
      ) : !data?.applications.length ? (
        <div className="bg-card text-card-foreground border-border flex flex-1 flex-col items-center justify-center rounded-xl border p-8 text-center">
          <div className="bg-primary/10 text-primary mb-3 flex size-12 items-center justify-center rounded-full">
            <Mail className="size-6" />
          </div>
          <h3 className="text-foreground text-base font-semibold">
            {t("outreachHub.emptyState.title")}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs sm:text-sm">
            {t("outreachHub.emptyState.description")}
          </p>
        </div>
      ) : !filteredApplications.length ? (
        <div className="bg-card text-card-foreground border-border flex flex-1 flex-col items-center justify-center rounded-xl border p-8 text-center">
          <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
            <Search className="size-6" />
          </div>
          <h3 className="text-foreground text-base font-semibold">
            {t("outreachHub.emptyState.noFilteredTitle")}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs sm:text-sm">
            {t("outreachHub.emptyState.noFilteredDescription")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 pb-4">
          {filteredApplications.map((app) => (
            <OutreachApplicationCard
              key={app.applicationId}
              application={app}
              dateFnsLocale={dateFnsLocale}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface OutreachStatsBarProps {
  stats: HubData["stats"] | undefined;
  isLoading: boolean;
  t: TranslationFn;
}

function OutreachStatsBar({ stats, isLoading, t }: OutreachStatsBarProps) {
  const statItems = [
    {
      id: "totalSent",
      label: t("outreachHub.stats.totalSent"),
      value: isLoading ? "-" : (stats?.totalSent ?? 0),
      icon: Mail,
      hint: null,
    },
    {
      id: "openRate",
      label: t("outreachHub.stats.openRate"),
      value: isLoading ? "-" : `${stats?.openRate ?? 0}%`,
      icon: TrendingUp,
      hint: null,
    },
    {
      id: "totalOpens",
      label: t("outreachHub.stats.totalOpens"),
      value: isLoading ? "-" : (stats?.totalOpens ?? 0),
      icon: Eye,
      hint: null,
    },
    {
      id: "recent24h",
      label: t("outreachHub.stats.recent24h"),
      value: isLoading ? "-" : (stats?.recentOpens24h ?? 0),
      icon: Zap,
      hint: t("outreachHub.stats.recent24hHint"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            title={item.hint ?? undefined}
            className="border-border bg-card text-card-foreground flex flex-col justify-between rounded-xl border p-3 shadow-xs transition-colors"
          >
            <div className="text-muted-foreground flex items-center justify-between gap-1 text-xs font-medium">
              <span>{item.label}</span>
              <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
            </div>
            <div className="text-foreground mt-2 text-xl font-bold tracking-tight sm:text-2xl">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface OutreachFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: HubFilter;
  onFilterChange: (filter: HubFilter) => void;
  t: TranslationFn;
}

function OutreachFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  t,
}: OutreachFilterBarProps) {
  const filters: { id: HubFilter; label: string }[] = [
    { id: "all", label: t("outreachHub.filters.all") },
    { id: "opened", label: t("outreachHub.filters.opened") },
    { id: "unopened", label: t("outreachHub.filters.unopened") },
  ];

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("outreachHub.filters.searchPlaceholder")}
          className="pl-9 text-xs sm:text-sm"
        />
      </div>

      <div className="bg-muted/40 flex items-center rounded-lg p-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface OutreachApplicationCardProps {
  application: HubApplication;
  dateFnsLocale: Parameters<typeof formatDistanceToNow>[1]["locale"];
  t: TranslationFn;
}

function OutreachApplicationCard({
  application,
  dateFnsLocale,
  t,
}: OutreachApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasReads = application.totalOpens > 0;
  const timeFormatted = application.lastOpenedAt
    ? formatDistanceToNow(new Date(application.lastOpenedAt), {
        addSuffix: true,
        locale: dateFnsLocale,
      })
    : application.lastSentAt
      ? formatDistanceToNow(new Date(application.lastSentAt), {
          addSuffix: true,
          locale: dateFnsLocale,
        })
      : "";

  return (
    <article className="border-border bg-card text-card-foreground rounded-xl border shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left info */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-foreground text-base font-semibold">
              {application.position}
            </h3>
            <Badge
              variant={
                statusVariants[
                  application.status as keyof typeof statusVariants
                ]
              }
            >
              {t(`status.${application.status as keyof typeof statusVariants}`)}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Building2 className="size-3.5" aria-hidden />
            <span className="font-medium">{application.company.name}</span>
            {application.company.location ? (
              <span>• {application.company.location}</span>
            ) : null}
          </div>
        </div>

        {/* Right metrics and actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          {hasReads ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
              <Eye className="size-3.5 shrink-0" aria-hidden />
              <span>
                {t("outreachHub.card.readsCount", {
                  count: application.totalOpens,
                })}
              </span>
              <span className="text-[0.6875rem] font-normal text-emerald-600/80">
                • {t("outreachHub.card.lastRead", { time: timeFormatted })}
              </span>
            </div>
          ) : (
            <div className="border-border bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              <span>{t("outreachHub.card.notReadYet")}</span>
              {timeFormatted ? (
                <span className="text-[0.6875rem]">
                  • {t("outreachHub.card.lastSent", { time: timeFormatted })}
                </span>
              ) : null}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={t("outreachHub.card.toggleDetails")}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <MailCheck className="size-3.5" aria-hidden />
              <span>
                {t("outreachHub.card.sentCount", {
                  count: application.totalEmails,
                })}
              </span>
              {isExpanded ? (
                <ChevronUp className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
            </Button>

            <Link
              href={{
                pathname: "/admin/job-tracker/applications/[id]",
                params: { id: application.applicationId },
              }}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("outreachHub.card.viewApplication")}
            </Link>
          </div>
        </div>
      </div>

      {/* Expanded Email History Details */}
      {isExpanded ? (
        <div className="border-border/60 bg-muted/20 border-t p-3 sm:p-4">
          <h4 className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-wider uppercase">
            {t("outreachHub.card.emailsHeading")}
          </h4>
          <div className="space-y-2.5">
            {application.emails.map((email) => (
              <OutreachEmailItem
                key={email.id}
                email={email}
                dateFnsLocale={dateFnsLocale}
                t={t}
              />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

interface OutreachEmailItemProps {
  email: HubEmail;
  dateFnsLocale: Parameters<typeof formatDistanceToNow>[1]["locale"];
  t: TranslationFn;
}

function OutreachEmailItem({
  email,
  dateFnsLocale,
  t,
}: OutreachEmailItemProps) {
  const [showHistory, setShowHistory] = useState(false);
  const sentDate = email.sentAt ? new Date(email.sentAt) : null;
  const sentFormatted = sentDate
    ? format(sentDate, "PPp", { locale: dateFnsLocale })
    : "";

  return (
    <div className="border-border bg-card text-card-foreground rounded-lg border p-3 text-xs shadow-2xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-foreground font-semibold">{email.subject}</p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {t("outreachHub.card.recipient", { email: email.recipientEmail })}
            </span>
            {sentFormatted ? (
              <span>
                • {t("outreachHub.card.sentAt", { date: sentFormatted })}
              </span>
            ) : null}
            {email.attachmentName ? (
              <span className="flex items-center gap-1 font-medium">
                <FileText className="size-3" aria-hidden />
                {t("outreachHub.card.attachment", {
                  name: email.attachmentName,
                })}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-start">
          {email.trackingEnabled ? (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary gap-1 py-0.5 text-[0.6875rem]"
            >
              <ShieldCheck className="size-3" aria-hidden />
              {t("outreachHub.card.tracked")}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground py-0.5 text-[0.6875rem]"
            >
              {t("outreachHub.card.untracked")}
            </Badge>
          )}

          {email.openCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-[0.6875rem] font-semibold"
            >
              <span>
                {t("outreachHub.card.opensCount", { count: email.openCount })}
              </span>
              {showHistory ? (
                <ChevronUp className="size-3" aria-hidden />
              ) : (
                <ChevronDown className="size-3" aria-hidden />
              )}
            </button>
          ) : (
            <span className="text-muted-foreground text-[0.6875rem]">
              {t("outreachHub.card.noOpensYet")}
            </span>
          )}
        </div>
      </div>

      {/* Detected opens breakdown */}
      {showHistory && email.opens.length > 0 ? (
        <div className="border-border/60 bg-muted/30 mt-2.5 space-y-1.5 rounded-md border p-2.5">
          <p className="text-muted-foreground text-[0.6875rem] font-medium uppercase">
            {t("outreachHub.card.openHistory")}
          </p>
          <ul className="space-y-1">
            {email.opens.map((open) => {
              const openDate = new Date(open.openedAt);
              const client = parseEmailClient(open.userAgent);
              const openFormatted = format(openDate, "PPp", {
                locale: dateFnsLocale,
              });
              const relativeFormatted = formatDistanceToNow(openDate, {
                addSuffix: true,
                locale: dateFnsLocale,
              });

              return (
                <li
                  key={open.id}
                  className="text-foreground flex flex-wrap items-center justify-between gap-1 text-[0.6875rem]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{client.clientName}</span>
                    {client.isProxy ? (
                      <span className="bg-muted text-muted-foreground rounded px-1 text-[0.625rem]">
                        {t("outreachHub.card.proxyNotice")}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground">
                    {openFormatted} ({relativeFormatted})
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
