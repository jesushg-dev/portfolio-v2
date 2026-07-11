import { getTranslations } from "next-intl/server";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <CertificationForm
          key={editorDto.id}
          initialData={editorDto}
          languages={languages}
        />
      </div>
    </div>
  );
}
