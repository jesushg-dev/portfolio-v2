export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { db } from "@/server/db";
import SettingsForm from "./settings-form";
import PdfLinksForm from "./pdf-links-form";
import { SettingsIntegrationsCard } from "./settings-integrations-card";

interface ISettingsPageProps {
  params: Promise<{ locale: string }>;
}

const SettingsPage: FC<ISettingsPageProps> = async ({ params }) => {
  const { locale } = await params;

  const t = await getTranslations("admin.settings");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return redirectToLogin(locale as Locale);
  }

  const { user } = session;

  const [profile, pdfLinks] = await Promise.all([
    db.profile.findUnique({
      where: { userId: user.id },
    }),
    db.cvPdfLink.findMany({
      where: { userId: user.id },
    }),
  ]);

  const pdfLinksRecord = pdfLinks.reduce(
    (acc, link) => {
      acc[link.locale] = link.url;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="flex w-full flex-col gap-6">
        <SettingsForm
          defaultValues={{
            username: profile?.username ?? "",
            displayName: profile?.displayName ?? user.name ?? "",
            defaultLocale:
              (profile?.defaultLocale as "en" | "es" | "nl") ?? "en",
            isPublished: profile?.isPublished ?? false,
            cvPdfUrl: profile?.cvPdfUrl ?? "",
            mapLocationLabel: profile?.mapLocationLabel ?? "",
          }}
        />
        <SettingsIntegrationsCard />
        <PdfLinksForm initialLinks={pdfLinksRecord} />
      </div>
    </div>
  );
};

export default SettingsPage;
