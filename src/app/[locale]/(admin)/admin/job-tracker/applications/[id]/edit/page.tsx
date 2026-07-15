import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { ApplicationForm } from "@/features/job-tracker/components/application-form";
import { getApplicationEditPageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);

  const [t, pageData] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getApplicationEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto, companies } = pageData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("editApplication")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editApplicationDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ApplicationForm
          key={editorDto.id}
          initialData={editorDto}
          companies={companies}
          locale={locale as Locale}
        />
      </div>
    </div>
  );
}
