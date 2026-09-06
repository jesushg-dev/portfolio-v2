export { generateMetadata } from "../metadata";
import { getTranslations } from "next-intl/server";

import { ProcessPageFormLazy } from "@/features/process-pages/components/admin/process-page-form-lazy";
import { getProcessPageCreatePageData } from "@/features/process-pages/server/process-pages-queries";

export default async function NewProcessPagePage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.processPages"),
    getProcessPageCreatePageData(),
  ]);

  return (
    <div className="w-full">
      <span className="sr-only">{t("createDescription")}</span>
      <ProcessPageFormLazy initialData={initialData} languages={languages} />
    </div>
  );
}
