"use client";

import { BarChart3, Briefcase, Building2, Clock, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import type { DashboardStats } from "@/features/job-tracker/types";

interface DashboardStatsProps {
  initialStats: DashboardStats;
}

export function DashboardStats({ initialStats }: DashboardStatsProps) {
  const t = useTranslations("admin.jobTracker");

  const { data: stats = initialStats } =
    api.jobTrackerAdmin.getDashboardStats.useQuery(undefined, {
      placeholderData: initialStats,
    });

  const cards = [
    {
      title: t("stats.totalApplications"),
      value: stats.totalApplications,
      description: t("stats.totalApplicationsDescription"),
      icon: Briefcase,
    },
    {
      title: t("stats.totalCompanies"),
      value: stats.totalCompanies,
      description: t("stats.totalCompaniesDescription"),
      icon: Building2,
    },
    {
      title: t("stats.inProgress"),
      value: stats.inProgress,
      description: t("stats.inProgressDescription"),
      icon: Clock,
    },
    {
      title: t("stats.offers"),
      value: stats.offers,
      description: t("stats.offersDescription"),
      icon: BarChart3,
    },
    {
      title: t("stats.hired"),
      value: stats.hired,
      description: t("stats.hiredDescription"),
      icon: Trophy,
      valueClassName: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.valueClassName ?? ""}`}>
              {card.value}
            </div>
            <p className="text-muted-foreground text-xs">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
