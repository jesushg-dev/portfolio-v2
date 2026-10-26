export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { PageSheetWrapper } from "@/components/shared/page-container";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { getCertificationEditPageData } from "@/features/certifications/server/certification-queries";

export default async function EditCertificationPage({
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
    <PageSheetWrapper
      title={t("edit")}
      description={t("editDescription")}
      fallbackUrl="/admin/certifications"
    >
      <CertificationForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageSheetWrapper>
  );
}
