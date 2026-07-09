import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ProfileTabs } from "@/features/profile/components/profile-tabs";

interface ProfileLayoutProps {
  children: ReactNode;
  tabs?: ReactNode;
}

export default async function ProfileLayout({
  children,
  tabs,
}: ProfileLayoutProps) {
  const t = await getTranslations("admin.profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="border-border bg-card rounded-xl border shadow-sm">
        <ProfileTabs />
        <div className="p-6">
          {tabs}
          {children}
        </div>
      </div>
    </div>
  );
}
