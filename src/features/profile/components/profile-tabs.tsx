"use client";

import { User, Code2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";

interface TabLinkType {
  id: string;
  href: React.ComponentProps<typeof Link>["href"];
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
}

export const ProfileTabs = () => {
  const t = useTranslations("admin.profile");
  const pathname = usePathname();

  const tabs: TabLinkType[] = [
    {
      id: "profile-tab-hero",
      href: "/admin/profile",
      label: t("heroSection"),
      icon: User,
      exact: true,
    },
    {
      id: "profile-tab-console",
      href: "/admin/profile/console",
      label: t("consoleTab"),
      icon: Code2,
    },
  ];

  return (
    <div className="bg-muted/30 flex overflow-hidden rounded-t-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href as string);

        return (
          <Link
            key={tab.id}
            id={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-primary text-primary bg-card"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
