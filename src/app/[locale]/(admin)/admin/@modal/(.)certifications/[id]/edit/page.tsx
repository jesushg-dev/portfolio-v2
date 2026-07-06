import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { CertificationForm } from "@/features/certifications/components/certification-form";

export default async function EditCertificationModal({
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

  const certification = await db.certification.findUnique({
    where: { id, userId: session.user.id },
    include: {
      CertificationTranslation: true,
      CertificateSkill: true,
    },
  });

  if (!certification) notFound();

  return (
    <PageDialogWrapper
      title={tActions("edit") || "Edit"}
      description="Edit existing certification"
    >
      <CertificationForm initialData={certification}  languages={languages} />
    </PageDialogWrapper>
  );
}
