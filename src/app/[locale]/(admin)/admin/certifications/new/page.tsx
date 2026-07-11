import { getTranslations } from "next-intl/server";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { getCertificationCreatePageData } from "@/features/certifications/server/certification-queries";

export default async function NewCertificationPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.certifications"),
    getCertificationCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("createDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <CertificationForm initialData={initialData} languages={languages} />
      </div>
    </div>
  );
}
