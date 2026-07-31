export { generateMetadata } from "../../../../services/[id]/edit/metadata";
import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ServiceForm } from "@/features/services/components/service-form";
import { getServiceEditPageData } from "@/features/services/server/service-queries";

export default async function EditServiceModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.services"),
    getServiceEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto, languages } = pageData;

  return (
    <PageDialogWrapper title={t("edit")} description={t("editDescription")}>
      <ServiceForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageDialogWrapper>
  );
}
