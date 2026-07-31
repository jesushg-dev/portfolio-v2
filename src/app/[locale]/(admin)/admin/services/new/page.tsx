export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { ServiceForm } from "@/features/services/components/service-form";
import { getServiceCreatePageData } from "@/features/services/server/service-queries";

export default async function NewServicePage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.services"),
    getServiceCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ServiceForm initialData={initialData} languages={languages} />
      </div>
    </div>
  );
}
