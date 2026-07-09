"use client";

import type { FC, ReactNode, ComponentProps } from "react";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  User,
  FileText,
  Code2,
  Briefcase,
  Wrench,
  Award,
  Settings,
  LogOut,
  Clock,
  Palette,
  Sparkles,
} from "lucide-react";

import { Link as CustomLink } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import ThemeSelector from "@/components/app-layout/app-header/theme-selector";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

interface IDashboardShellProps {
  children: ReactNode;
  userName: string;
}

type NavItem = {
  href: Extract<ComponentProps<typeof CustomLink>["href"], string>;
  labelKey:
    | "overview"
    | "profile"
    | "cv"
    | "timeline"
    | "softSkills"
    | "skills"
    | "projects"
    | "services"
    | "certifications"
    | "settings";
  icon: typeof LayoutDashboard;
  group?: "portfolio";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard },
  { href: "/admin/profile", labelKey: "profile", icon: User },
  { href: "/admin/cv", labelKey: "cv", icon: FileText },
  // ── Portfolio content ─────────────────────────────────
  {
    href: "/admin/skills",
    labelKey: "skills",
    icon: Code2,
    group: "portfolio",
  },
  {
    href: "/admin/timeline",
    labelKey: "timeline",
    icon: Clock,
    group: "portfolio",
  },
  {
    href: "/admin/soft-skills",
    labelKey: "softSkills",
    icon: Sparkles,
    group: "portfolio",
  },
  {
    href: "/admin/projects",
    labelKey: "projects",
    icon: Briefcase,
    group: "portfolio",
  },
  {
    href: "/admin/services",
    labelKey: "services",
    icon: Wrench,
    group: "portfolio",
  },
  {
    href: "/admin/certifications",
    labelKey: "certifications",
    icon: Award,
    group: "portfolio",
  },
  // ── Config ─────────────────────────────────────────────
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

const Logo = ({ userName, title }: { userName: string; title: string }) => {
  return (
    <CustomLink
      href="/admin"
      className="z-20 flex items-center gap-2 px-2 py-1 font-bold"
    >
      <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
        {userName.charAt(0).toUpperCase()}
      </div>
      <span className="text-foreground text-sm font-bold whitespace-pre opacity-100 transition-opacity">
        {title}
      </span>
    </CustomLink>
  );
};

const LogoIcon = ({ userName }: { userName: string }) => {
  return (
    <CustomLink
      href="/admin"
      className="z-20 flex items-center gap-2 px-2 py-1 font-bold"
    >
      <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
        {userName.charAt(0).toUpperCase()}
      </div>
    </CustomLink>
  );
};

const DashboardShell: FC<IDashboardShellProps> = ({ children, userName }) => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin.shell");
  const [open, setOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const onSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const normalizedPathname = useMemo(() => {
    if (!pathname) return "";
    return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  }, [pathname]);

  const isActive = (item: NavItem) => {
    if (item.href === "/admin") {
      // Exact match for overview — avoid matching all sub-routes
      return (
        normalizedPathname.endsWith("/admin") ||
        normalizedPathname.endsWith("/admin/")
      );
    }
    return normalizedPathname.includes(item.href);
  };

  const pageTitle = useMemo(() => {
    const matched = [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => {
        if (item.href === "/admin") {
          return (
            normalizedPathname === "/admin" || normalizedPathname === "/admin/"
          );
        }
        return normalizedPathname.startsWith(item.href);
      });

    return matched ? t(`nav.${matched.labelKey}`) : t("title");
  }, [normalizedPathname, t]);

  const pageSubtitle = useMemo(() => {
    if (normalizedPathname.endsWith("/new")) return t("createNewItem");
    if (normalizedPathname.includes("/edit")) return t("editItem");
    return "";
  }, [normalizedPathname, t]);

  const portfolioItems = NAV_ITEMS.filter((i) => i.group === "portfolio");
  const topItems = NAV_ITEMS.filter(
    (i) => !i.group && i.labelKey !== "settings",
  );
  const settingsItem = NAV_ITEMS.find((i) => i.labelKey === "settings")!;

  return (
    <div className="bg-background text-foreground flex h-screen w-full flex-col overflow-hidden md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex h-12 items-center">
              {open ? (
                <Logo userName={userName} title={t("title")} />
              ) : (
                <LogoIcon userName={userName} />
              )}
            </div>

            <div className="mt-8 flex flex-col gap-1">
              {topItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarLink
                    key={item.labelKey}
                    link={{
                      label: t(`nav.${item.labelKey}`),
                      href: item.href,
                      icon: <Icon className="h-5 w-5 shrink-0" />,
                      active: isActive(item),
                    }}
                  />
                );
              })}
            </div>

            <div className="my-1">
              <div className="mb-1 flex h-6 items-end px-3">
                {open && (
                  <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-widest uppercase">
                    {t("nav.portfolioGroup")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {portfolioItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarLink
                      key={item.labelKey}
                      link={{
                        label: t(`nav.${item.labelKey}`),
                        href: item.href,
                        icon: <Icon className="h-5 w-5 shrink-0" />,
                        active: isActive(item),
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <SidebarLink
              link={{
                label: t("nav.settings"),
                href: settingsItem.href,
                icon: <Settings className="h-5 w-5 shrink-0" />,
                active: isActive(settingsItem),
              }}
            />
            <button
              type="button"
              onClick={onSignOut}
              className="group/sidebar text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-start gap-3 rounded-lg px-2 py-2 transition-colors"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <LogOut className="h-5 w-5 shrink-0" />
              </div>
              {open && (
                <span className="inline-block text-sm font-medium whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1">
                  {t("signOut")}
                </span>
              )}
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="border-border/60 bg-background/75 supports-[backdrop-filter]:bg-background/55 sticky top-0 z-30 hidden border-b shadow-sm backdrop-blur-lg backdrop-saturate-150 md:block">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-foreground text-sm font-semibold">
                  {pageTitle}
                </p>
                {pageSubtitle ? (
                  <p className="text-muted-foreground text-xs">
                    {pageSubtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4">
              <button
                type="button"
                aria-label={t("toggleThemeAria")}
                onClick={() => setThemeMenuOpen((prev) => !prev)}
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border p-2"
              >
                <Palette className="h-4 w-4" />
              </button>
              <div className="hidden text-right md:block">
                <p className="text-foreground text-sm font-medium">
                  {userName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("portfolioManager")}
                </p>
              </div>
              <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <ThemeSelector
          visible={themeMenuOpen}
          onChange={() => setThemeMenuOpen(false)}
          className="max-w-none justify-end px-4 pt-2 md:px-6"
        />

        <div className="flex w-full flex-1 flex-col p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardShell;
