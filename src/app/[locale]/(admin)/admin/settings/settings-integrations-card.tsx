import { KeyRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

export async function SettingsIntegrationsCard() {
  const t = await getTranslations("admin.settings");

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <KeyRound className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-base font-semibold">
              {t("credentialsTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("credentialsDescription")}
            </p>
          </div>
        </div>
        <Link
          href="/admin/credentials"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
        >
          {t("credentialsCta")}
        </Link>
      </div>
    </div>
  );
}
