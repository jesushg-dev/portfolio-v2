import { getTranslations } from "next-intl/server";

export { generateMetadata } from "./metadata";

import HeaderArticle from "@/components/shared/header-article";

export default async function PrivacyPage() {
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

          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold">
              {t("analytics.title")}
            </h2>
            <p>{t("analytics.intro")}</p>
            <div>
              <h3 className="text-foreground mb-2 font-medium">
                {t("analytics.storedTitle")}
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>{t("analytics.storedPageviews")}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-medium">
                {t("analytics.notStoredTitle")}
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>{t("analytics.notStoredIp")}</li>
                <li>{t("analytics.notStoredId")}</li>
                <li>{t("analytics.notStoredCity")}</li>
              </ul>
            </div>
            <p>{t("analytics.purpose")}</p>
            <p>{t("analytics.optOut")}</p>
            <p>{t("analytics.retention")}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
