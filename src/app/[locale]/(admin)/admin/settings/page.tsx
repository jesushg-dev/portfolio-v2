export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { ShieldCheck, User } from "lucide-react";

import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { db } from "@/server/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsForm from "./settings-form";
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

  const [profile, credentialAccount] = await Promise.all([
    db.profile.findUnique({
      where: { userId: user.id },
    }),
    db.account.findFirst({
      where: { userId: user.id, providerId: CREDENTIAL_PROVIDER_ID },
      select: { id: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/70 inline-flex h-11 w-full max-w-md justify-start gap-1 p-1 sm:w-auto">
            <TabsTrigger
              value="general"
              className="gap-2 px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              <User className="size-4" aria-hidden />
              <span>{t("tabGeneral")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="gap-2 px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              <ShieldCheck className="size-4" aria-hidden />
              <span>{t("tabSecurity")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" keepMounted className="space-y-6">
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
        </TabsContent>

        <TabsContent value="security" keepMounted className="space-y-6">
          <SecuritySettingsCard
            twoFactorEnabled={user.twoFactorEnabled ?? false}
            hasPassword={credentialAccount !== null}
          />
          <SettingsIntegrationsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
