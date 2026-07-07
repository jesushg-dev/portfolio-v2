import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { CertificationForm } from "@/features/certifications/components/certification-form";

export default async function EditCertificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const { id } = await params;
  const t = await getTranslations("admin.certifications");

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <CertificationForm initialData={certification} languages={languages} />
      </div>
    </div>
  );
}
