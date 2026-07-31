export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { SoftSkillForm } from "@/features/soft-skills/components/soft-skill-form";
import { getSoftSkillCreatePageData } from "@/features/soft-skills/server/soft-skill-queries";

export default async function NewSoftSkillPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.softSkills"),
    getSoftSkillCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("addNew")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <SoftSkillForm initialData={initialData} languages={languages} />
      </div>
    </div>
  );
}
