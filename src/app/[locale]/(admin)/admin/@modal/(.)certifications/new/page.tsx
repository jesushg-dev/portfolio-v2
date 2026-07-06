import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { db } from "@/server/db";

export default async function NewCertificationModal() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.certifications");

  return (
    <PageDialogWrapper
      title={t("create") || "Create"}
      description="Add a new certification"
    >
      <CertificationForm languages={languages} />
    </PageDialogWrapper>
  );
}
