"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationTimeline } from "@/features/job-tracker/components/application-timeline";
import type { ApplicationDetail } from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import { statusVariants } from "@/features/job-tracker/lib/constants";

interface ApplicationDetailViewProps {
  application: ApplicationDetail;
  locale: Locale;
}

export const ApplicationDetailView: FC<ApplicationDetailViewProps> = ({
  application,
  locale,
}) => {
  const t = useTranslations("admin.jobTracker");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {application.position}
          </h2>
          <p className="text-muted-foreground">{application.company.name}</p>
          <Badge variant={statusVariants[application.status]}>
            {t(`status.${application.status}`)}
          </Badge>
        </div>
        <Button
          variant="outline"
          render={
            <Link
              href={`/admin/job-tracker/applications/${application.id}/edit`}
            />
          }
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("edit")}
        </Button>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">{t("detail.timelineTab")}</TabsTrigger>
          <TabsTrigger value="details">{t("detail.detailsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <ApplicationTimeline application={application} locale={locale} />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            {application.description && (
              <div>
                <h4 className="mb-2 font-medium">
                  {t("detail.jobDescription")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {application.description}
                </p>
              </div>
            )}

            {application.salary && (
              <div>
                <h4 className="mb-2 font-medium">{t("detail.salary")}</h4>
                <p className="text-muted-foreground text-sm">
                  {application.salary}
                </p>
              </div>
            )}

            {application.location && (
              <div>
                <h4 className="mb-2 font-medium">{t("detail.location")}</h4>
                <p className="text-muted-foreground text-sm">
                  {application.location}
                </p>
              </div>
            )}

            {application.notes && (
              <div>
                <h4 className="mb-2 font-medium">{t("detail.notes")}</h4>
                <p className="text-muted-foreground text-sm">
                  {application.notes}
                </p>
              </div>
            )}

            {application.cvFile && (
              <div>
                <h4 className="mb-2 font-medium">{t("detail.cv")}</h4>
                <a
                  href={application.cvFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm hover:underline"
                >
                  {application.cvFile.name}
                </a>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
