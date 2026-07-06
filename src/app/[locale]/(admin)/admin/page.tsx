import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { Award, Briefcase, Code, Settings } from "lucide-react";

import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/server/db";

interface IDashboardPageProps {
  params: Promise<{ locale: string }>;
}

const DashboardPage: FC<IDashboardPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("admin.dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  const [
    profile,
    certificationsCount,
    projectsCount,
    skillsCount,
    servicesCount,
  ] = await Promise.all([
    userId
      ? db.profile.findUnique({ where: { userId } })
      : Promise.resolve(null),
    userId ? db.certification.count({ where: { userId } }) : Promise.resolve(0),
    userId ? db.project.count({ where: { userId } }) : Promise.resolve(0),
    userId ? db.skill.count({ where: { userId } }) : Promise.resolve(0),
    userId ? db.service.count({ where: { userId } }) : Promise.resolve(0),
  ]);

  const stats = [
    {
      title: t("stats.certificates.title"),
      count: certificationsCount,
      description: t("stats.certificates.description"),
      href: "/admin/certifications" as const,
      icon: Award,
      color: "bg-primary/15",
      iconColor: "text-primary",
    },
    {
      title: t("stats.projects.title"),
      count: projectsCount,
      description: t("stats.projects.description"),
      href: "/admin/projects" as const,
      icon: Briefcase,
      color: "bg-secondary/40",
      iconColor: "text-secondary-foreground",
    },
    {
      title: t("stats.skills.title"),
      count: skillsCount,
      description: t("stats.skills.description"),
      href: "/admin/skills" as const,
      icon: Code,
      color: "bg-accent",
      iconColor: "text-accent-foreground",
    },
    {
      title: t("stats.services.title"),
      count: servicesCount,
      description: t("stats.services.description"),
      href: "/admin/services" as const,
      icon: Settings,
      color: "bg-muted",
      iconColor: "text-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("welcomeTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("welcomeSubtitle")}
        </p>
      </div>

      {!profile ? (
        <Card className="border-border bg-muted/40 border ring-0">
          <CardHeader>
            <CardTitle className="text-foreground">{t("noProfile")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.rich("noProfileHint", {
                link: (chunks) => (
                  <Link
                    href="/admin/settings"
                    className="font-medium underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <Icon className={`size-4 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">
                  {stat.count}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {stat.description}
                </p>
                <Link
                  href={stat.href}
                  className="text-foreground mt-5 inline-block text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {t("manage")}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">
          {t("quickStart.title")}
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("quickStart.languageSupport.title")}</CardTitle>
              <CardDescription>
                {t("quickStart.languageSupport.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("quickStart.languageSupport.description")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("quickStart.gettingStarted.title")}</CardTitle>
              <CardDescription>
                {t("quickStart.gettingStarted.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("quickStart.gettingStarted.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
