import { getTranslations } from "next-intl/server";
import { ServiceForm } from "@/features/services/components/service-form";
import { db } from "@/server/db";

export default async function NewServicePage() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.services");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("create") || "Create"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new service offering
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ServiceForm  languages={languages} />
      </div>
    </div>
  );
}
