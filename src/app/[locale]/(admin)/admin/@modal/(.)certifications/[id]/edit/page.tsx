import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { getCertificationEditPageData } from "@/features/certifications/server/certification-queries";

export default async function EditCertificationModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.certifications"),
    getCertificationEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto, languages } = pageData;

  return (
    <PageDialogWrapper title={t("edit")} description={t("editDescription")}>
      <CertificationForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageDialogWrapper>
  );
}
