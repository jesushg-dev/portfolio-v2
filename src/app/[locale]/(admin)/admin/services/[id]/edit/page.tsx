import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ServiceForm } from "@/features/services/components/service-form";

export default async function EditServicePage({
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {tActions("edit") || "Edit"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit existing service
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ServiceForm initialData={service}  languages={languages} />
      </div>
    </div>
  );
}
