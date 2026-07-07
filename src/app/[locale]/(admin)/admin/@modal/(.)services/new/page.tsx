import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ServiceForm } from "@/features/services/components/service-form";
import { db } from "@/server/db";

export default async function NewServiceModal() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.services");

  return (
    <PageDialogWrapper
      title={t("create") || "Create"}
      description={t("createDescription")}
    >
      <ServiceForm languages={languages} />
    </PageDialogWrapper>
  );
}
