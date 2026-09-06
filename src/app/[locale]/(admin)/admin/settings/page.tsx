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
import SecuritySettingsCard from "@/features/auth/components/security/security-settings-card";
import { CREDENTIAL_PROVIDER_ID } from "@/lib/auth-account-issuer";

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

  const [profile, pdfLinks, credentialAccount] = await Promise.all([
    db.profile.findUnique({
      where: { userId: user.id },
    }),
    db.cvPdfLink.findMany({
      where: { userId: user.id },
    }),
    db.account.findFirst({
      where: { userId: user.id, providerId: CREDENTIAL_PROVIDER_ID },
      select: { id: true },
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
            logoInitials: profile?.logoInitials ?? "",
            logoImageUrl: profile?.logoImageUrl ?? "",
            defaultLocale:
              (profile?.defaultLocale as "en" | "es" | "nl") ?? "en",
            isPublished: profile?.isPublished ?? false,
            mapLocationLabel: profile?.mapLocationLabel ?? "",
          }}
        />
        <SecuritySettingsCard
          twoFactorEnabled={user.twoFactorEnabled ?? false}
          hasPassword={credentialAccount !== null}
        />
        <SettingsIntegrationsCard />
        <PdfLinksForm initialLinks={pdfLinksRecord} />
      </div>
    </div>
  );
};

export default SettingsPage;
