import { getTranslations } from "next-intl/server";
import type { FC, ReactNode } from "react";

import { ProfileTabs } from "@/features/profile/components/profile-tabs";

interface Props {
  children: ReactNode;
  tabs: ReactNode;
}

const ProfileLayout: FC<Props> = async ({ children, tabs }) => {
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
};

export default ProfileLayout;
