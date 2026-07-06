import { getTranslations } from "next-intl/server";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { db } from "@/server/db";

export default async function NewCertificationPage() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.certifications");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("create") || "Create"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new certification
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <CertificationForm  languages={languages} />
      </div>
    </div>
  );
}
