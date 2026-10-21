export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { ApplicationForm } from "@/features/job-tracker/components/application-form";
import { getApplicationCreatePageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [t, { initialData, companies }] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getApplicationCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("createApplication")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("createApplicationDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <ApplicationForm
          initialData={initialData}
          companies={companies}
          locale={locale as Locale}
          variant="page"
        />
      </div>
    </div>
  );
}
