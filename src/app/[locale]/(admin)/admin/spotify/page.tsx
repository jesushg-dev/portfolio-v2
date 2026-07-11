import type { FC } from "react";
import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import SpotifyConnectPage from "@/features/spotify-connect/components/spotify-connect-page";

interface ISpotifyAdminPageProps {
  params: Promise<{ locale: string }>;
}

const SpotifyAdminPage: FC<ISpotifyAdminPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("admin.spotify");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return redirectToLogin(locale as Locale);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <Suspense fallback={null}>
        <SpotifyConnectPage />
      </Suspense>
    </div>
  );
};

export default SpotifyAdminPage;
