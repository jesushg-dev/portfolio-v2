import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { SkillForm } from "@/features/skills/components/skill-form";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditSkillPage({ params }: Props) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const { id } = await params;

  const skill = await db.skill.findUnique({
    where: { id },
    include: { SkillTranslation: true },
  });

  if (!skill) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Skill</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update an existing skill in your portfolio.
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <SkillForm initialData={skill} languages={languages} />
      </div>
    </div>
  );
}
