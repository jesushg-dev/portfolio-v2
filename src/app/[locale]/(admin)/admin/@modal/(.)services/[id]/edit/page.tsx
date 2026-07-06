import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ServiceForm } from "@/features/services/components/service-form";

export default async function EditServiceModal({
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

  const service = await db.service.findUnique({
    where: { id, userId: session.user.id },
    include: {
      ServiceTranslation: true,
      ServiceSkill: true,
    },
  });

  if (!service) notFound();

  return (
    <PageDialogWrapper
      title={tActions("edit") || "Edit"}
      description="Edit existing service"
    >
      <ServiceForm initialData={service} languages={languages} />
    </PageDialogWrapper>
  );
}
