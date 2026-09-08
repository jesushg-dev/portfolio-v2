export { generateMetadata } from "../../metadata";
import { getTranslations } from "next-intl/server";

import { ProcessPageForm } from "@/features/process-pages/components/admin/process-page-form";
import { getProcessPageEditPageData } from "@/features/process-pages/server/process-pages-queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProcessPagePage({ params }: Props) {
  const { id } = await params;
  const [t, { editorDto, languages }] = await Promise.all([
    getTranslations("admin.processPages"),
    getProcessPageEditPageData(id),
  ]);

  return (
    <div className="w-full">
      <span className="sr-only">{t("editDescription")}</span>
      <ProcessPageForm initialData={editorDto} languages={languages} />
    </div>
  );
}
