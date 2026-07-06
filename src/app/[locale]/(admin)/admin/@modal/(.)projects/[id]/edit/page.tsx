import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";

export default async function EditProjectModal({
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
    <PageDialogWrapper
      title={tActions("edit")}
      description="Edit existing portfolio project"
    >
      <ProjectForm initialData={project}  languages={languages} />
    </PageDialogWrapper>
  );
}
