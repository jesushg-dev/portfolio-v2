"use client";

import {
  BarChart3,
  Briefcase,
  Building2,
  Clock,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import type { DashboardStats } from "@/features/job-tracker/types";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  initialStats: DashboardStats;
}

interface StatItem {
  title: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  iconClass: string;
}

export function DashboardStats({ initialStats }: DashboardStatsProps) {
  const t = useTranslations("admin.jobTracker");

  const { data: stats = initialStats } =
    api.jobTrackerAdmin.getDashboardStats.useQuery(undefined, {
      placeholderData: initialStats,
    });

  const items: StatItem[] = [
    {
      title: t("stats.totalApplications"),
      value: stats.totalApplications,
      icon: Briefcase,
      accent: "border-l-primary",
      iconClass: "bg-primary/10 text-primary",
    },
    {
      title: t("stats.totalCompanies"),
      value: stats.totalCompanies,
      icon: Building2,
      accent: "border-l-sky-500",
      iconClass: "bg-sky-500/10 text-sky-600",
    },
    {
      title: t("stats.inProgress"),
      value: stats.inProgress,
      icon: Clock,
      accent: "border-l-amber-500",
      iconClass: "bg-amber-500/10 text-amber-600",
    },
    {
      title: t("stats.offers"),
      value: stats.offers,
      icon: BarChart3,
      accent: "border-l-emerald-500",
      iconClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: t("stats.hired"),
      value: stats.hired,
      icon: Trophy,
      accent: "border-l-emerald-600",
      iconClass: "bg-emerald-600/10 text-emerald-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <StatCard key={item.title} item={item} />
      ))}
    </div>
  );
}

function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon;

  return (
    <div
      className={cn(
        "bg-card text-card-foreground border-border flex items-center gap-3 rounded-xl border border-l-[3px] p-4 shadow-sm",
        item.accent,
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          item.iconClass,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-semibold tabular-nums">
          {item.value}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {item.title}
        </p>
      </div>
    </div>
  );
}
