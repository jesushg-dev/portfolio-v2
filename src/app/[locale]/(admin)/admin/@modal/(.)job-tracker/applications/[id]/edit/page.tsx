export { generateMetadata } from "../../../../../job-tracker/applications/[id]/edit/metadata";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { ApplicationForm } from "@/features/job-tracker/components/application-form";
import { getApplicationEditPageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function EditApplicationModal({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getApplicationEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto, companies } = pageData;

  return (
    <PageDialogWrapper
      title={t("editApplication")}
      description={t("editApplicationDescription")}
    >
      <ApplicationForm
        key={editorDto.id}
        initialData={editorDto}
        companies={companies}
        locale={locale as Locale}
      />
    </PageDialogWrapper>
  );
}
