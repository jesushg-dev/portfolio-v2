import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { type Locale as AppLocale, locales } from "@/i18n/config";

interface PrivacyPageProps {
  params: Promise<{ locale: AppLocale }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;

  setRequestLocale(locale);
  const t = await getTranslations("legal.privacy");

  return (
    <section className="bg-background min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 lg:container lg:px-20">
        <HeaderArticle
          title={t("title")}
          subtitle={t("subtitle")}
          description={t("updatedAt")}
        />

        <div className="text-muted-foreground mt-10 space-y-8 text-sm leading-relaxed">
          <p>{t("intro")}</p>

          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold">
              {t("spotify.title")}
            </h2>
            <p>{t("spotify.intro")}</p>
            <div>
              <h3 className="text-foreground mb-2 font-medium">
                {t("spotify.storedTitle")}
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>{t("spotify.storedClientId")}</li>
                <li>{t("spotify.storedClientSecret")}</li>
                <li>{t("spotify.storedRefreshToken")}</li>
                <li>{t("spotify.storedScope")}</li>
              </ul>
            </div>
            <p>{t("spotify.purpose")}</p>
            <p>{t("spotify.disconnect")}</p>
            <p>{t("spotify.retention")}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
