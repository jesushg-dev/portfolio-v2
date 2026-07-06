import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ProjectForm } from "@/features/projects/components/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const { id } = await params;
  const tActions = await getTranslations("admin.actions");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const project = await db.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      ProjectTranslation: true,
      ProjectSkill: true,
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {tActions("edit")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit existing portfolio project
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ProjectForm initialData={project}  languages={languages} />
      </div>
    </div>
  );
}
