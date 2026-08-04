export { generateMetadata } from "../../metadata";
import { getTranslations } from "next-intl/server";

import { NowFocusForm } from "@/features/now/components/admin/now-focus-form";
import { getNowFocusCreatePageData } from "@/features/now/server/now-queries";

export default async function NewNowFocusPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.now"),
    getNowFocusCreatePageData(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("addFocus")}
        </h1>
      </div>
      <NowFocusForm initialData={initialData} languages={languages} />
    </div>
  );
}
