import { getTranslations } from "next-intl/server";
import { SkillForm } from "@/features/skills/components/skill-form";
import { db } from "@/server/db";

export default async function NewSkillPage() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.skills");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("addNew")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <SkillForm languages={languages} />
      </div>
    </div>
  );
}
