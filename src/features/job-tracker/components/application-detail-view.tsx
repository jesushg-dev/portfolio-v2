"use client";

import { useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Pencil } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationTimeline } from "@/features/job-tracker/components/application-timeline";
import { ResumeTailorWorkflow } from "@/features/resume-engine/components/resume-tailor-workflow";
import type { ApplicationDetail } from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import { statusVariants } from "@/features/job-tracker/lib/constants";

type ApplicationDetailTab = "timeline" | "details" | "tailor";

interface ApplicationDetailViewProps {
  application: ApplicationDetail;
  locale: Locale;
  defaultTab?: ApplicationDetailTab;
}

export const ApplicationDetailView: FC<ApplicationDetailViewProps> = ({
  application,
  locale,
  defaultTab = "timeline",
}) => {
  const t = useTranslations("admin.jobTracker");
  const [activeTab, setActiveTab] = useState<ApplicationDetailTab>(defaultTab);

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
        <Link
          href={{
            pathname: "/admin/job-tracker/applications/[id]/edit",
            params: { id: application.id },
          }}
          className={buttonVariants({ variant: "outline" })}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("edit")}
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ApplicationDetailTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">{t("detail.timelineTab")}</TabsTrigger>
          <TabsTrigger value="details">{t("detail.detailsTab")}</TabsTrigger>
          <TabsTrigger value="tailor">{t("detail.tailorTab")}</TabsTrigger>
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

        <TabsContent value="tailor" className="space-y-4">
          {activeTab === "tailor" ? (
            <ResumeTailorWorkflow applicationId={application.id} embedded />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};
