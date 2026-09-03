"use client";

import type { FC, ReactNode, ComponentProps } from "react";
import { useMemo, useRef, useState } from "react";
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
  ClipboardList,
  MonitorSmartphone,
  Radio,
} from "lucide-react";

import { Link as CustomLink, usePathname, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import ThemeSelectorLazy from "@/components/app-layout/app-header/theme-selector-lazy";
import LocaleSelector from "@/components/app-layout/app-header/locale-selector";
import ScrollToTop from "@/components/custom-ui/scroll-to-top";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarPinToggle,
} from "@/components/ui/sidebar";

interface IDashboardShellProps {
  children: ReactNode;
  modal?: ReactNode;
  userName: string;
}

interface NavItem {
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
    | "spotify"
    | "jobTracker"
    | "settings"
    | "uses"
    | "now";
  icon: typeof LayoutDashboard;
  group?: "portfolio" | "pages";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard },
  { href: "/admin/profile", labelKey: "profile", icon: User },
  { href: "/admin/cv", labelKey: "cv", icon: FileText },
  {
    href: "/admin/job-tracker",
    labelKey: "jobTracker",
    icon: ClipboardList,
  },
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
  {
    href: "/admin/uses",
    labelKey: "uses",
    icon: MonitorSmartphone,
    group: "pages",
  },
  {
    href: "/admin/now",
    labelKey: "now",
    icon: Radio,
    group: "pages",
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

const DashboardShell: FC<IDashboardShellProps> = ({
  children,
  modal,
  userName,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin.shell");
  const [open, setOpen] = useState(true);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const onSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const normalizedPathname = useMemo(() => {
    if (!pathname) return "";
    return pathname;
  }, [pathname]);

  const isAdminOverview = (path: string) =>
    path === "/admin" || path === "/admin/";

  const isActive = (item: NavItem) => {
    if (item.href === "/admin") {
      return isAdminOverview(normalizedPathname);
    }
    if (item.labelKey === "settings") {
      return (
        normalizedPathname.startsWith("/admin/settings") ||
        normalizedPathname.startsWith("/admin/credentials")
      );
    }
    return normalizedPathname.startsWith(item.href);
  };

  const pageTitle = useMemo(() => {
    if (normalizedPathname.startsWith("/admin/credentials")) {
      return t("nav.credentials");
    }

    const matched = [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => {
        if (item.href === "/admin") {
          return isAdminOverview(normalizedPathname);
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
  const pagesItems = NAV_ITEMS.filter((i) => i.group === "pages");
  const topItems = NAV_ITEMS.filter(
    (i) => !i.group && i.labelKey !== "settings",
  );
  const settingsItem = NAV_ITEMS.find((i) => i.labelKey === "settings")!;

  return (
    <div className="bg-background text-foreground flex h-screen w-full flex-col overflow-hidden md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody
          className="h-full min-h-0 justify-between gap-4"
          mobileActions={
            <>
              <LocaleSelector />
              <button
                type="button"
                aria-label={t("toggleThemeAria")}
                onClick={() => setThemeMenuOpen((prev) => !prev)}
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 rounded-lg border p-2"
              >
                <Palette className="h-4 w-4" />
              </button>
            </>
          }
        >
          <div className="flex h-12 shrink-0 items-center justify-between gap-1">
            {open ? (
              <Logo userName={userName} title={t("title")} />
            ) : (
              <LogoIcon userName={userName} />
            )}
            <SidebarPinToggle />
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <nav aria-label={t("nav.sidebar")} className="flex flex-col gap-1">
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
            </nav>

            <div className="my-1">
              <div className="mb-1 flex h-6 items-end px-3">
                {open && (
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    {t("nav.portfolioGroup")}
                  </p>
                )}
              </div>
              <nav
                aria-label={t("nav.portfolioGroup")}
                className="flex flex-col gap-1"
              >
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
              </nav>
            </div>

            <div className="my-1">
              <div className="mb-1 flex h-6 items-end px-3">
                {open && (
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    {t("nav.pagesGroup")}
                  </p>
                )}
              </div>
              <nav
                aria-label={t("nav.pagesGroup")}
                className="flex flex-col gap-1"
              >
                {pagesItems.map((item) => {
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
              </nav>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-1 border-t pt-3">
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
              aria-label={t("signOut")}
              onClick={() => {
                void onSignOut();
              }}
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

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          ref={mainRef}
          className="flex min-w-0 flex-1 flex-col overflow-y-auto"
        >
          <header
            aria-label={t("pageToolbar")}
            className="border-border/60 bg-background/75 supports-backdrop-filter:bg-background/55 sticky top-0 z-30 hidden border-b shadow-sm backdrop-blur-lg backdrop-saturate-150 md:block"
          >
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-foreground text-sm font-semibold">
                    {pageTitle}
                  </h1>
                  {pageSubtitle ? (
                    <p className="text-muted-foreground text-xs">
                      {pageSubtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4">
                <LocaleSelector />
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

          <ThemeSelectorLazy
            open={themeMenuOpen}
            onOpenChange={setThemeMenuOpen}
          />

          <div className="flex w-full flex-1 flex-col p-4 md:p-6">
            {children}
          </div>
        </main>
        <div className="pointer-events-none absolute right-4 bottom-4 z-40">
          <ScrollToTop containerRef={mainRef} />
        </div>
      </div>
      {modal}
    </div>
  );
};

export default DashboardShell;
