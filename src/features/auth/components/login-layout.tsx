"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Palette,
  ShieldCheck,
  Shuffle,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { api } from "@/trpc/react";
import AuthBrandHeader from "@/features/auth/components/auth-brand-header";
import LocaleSelector from "@/components/app-layout/app-header/locale-selector";
import ThemeSelectorLazy from "@/components/app-layout/app-header/theme-selector-lazy";
import { headerIconControlStyles } from "@/components/app-layout/app-header/toolbar-control-styles";

export type AuthVisualVariant = "login" | "register" | "reset";

export interface RegisterPreviewData {
  name?: string;
  username?: string;
}

interface LoginLayoutProps {
  children: ReactNode;
  badge?: string;
  variant?: AuthVisualVariant;
  registerPreview?: RegisterPreviewData;
}

type AuthShowcaseTranslation = ReturnType<
  typeof useTranslations<"auth.showcase">
>;

export default function LoginLayout({
  badge,
  children,
  registerPreview,
  variant = "login",
}: LoginLayoutProps) {
  const t = useTranslations("auth.showcase");
  const locale = useLocale();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  return (
    <div className="bg-background text-foreground relative isolate min-h-screen w-full overflow-hidden">
      <AuthGlow />
      <ThemeSelectorLazy
        open={isThemeMenuOpen}
        onOpenChange={setIsThemeMenuOpen}
      />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <AuthBrandHeader dark />
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center text-sm transition-colors sm:inline-flex"
          >
            {t("backToPortfolio")}
          </Link>
          <LocaleSelector />
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((open) => !open)}
            aria-pressed={isThemeMenuOpen}
            className={headerIconControlStyles(false, {
              active: isThemeMenuOpen,
            })}
          >
            <span className="sr-only">{t("openThemeMenu")}</span>
            <Palette aria-hidden className="size-4" />
          </button>
        </div>
      </header>
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto w-full max-w-md">
          {badge ? <AuthBadge label={badge} /> : null}
          {children}
        </div>
        <AuthShowcase
          locale={locale}
          preview={registerPreview}
          t={t}
          variant={variant}
        />
      </div>
    </div>
  );
}

function AuthGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 75% 30%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%), radial-gradient(40% 35% at 10% 90%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />
      <div className="bg-primary/15 absolute top-0 right-0 size-96 rounded-full blur-3xl" />
      <div className="bg-primary/10 absolute bottom-0 left-0 size-72 rounded-full blur-3xl" />

      {/* Grid (cuadrícula) */}
      <svg
        aria-hidden
        className="stroke-foreground/14 pointer-events-none absolute inset-0 size-full"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black, transparent 75%)",
        }}
      >
        <defs>
          <pattern
            id="auth-grid-pattern"
            width={48}
            height={48}
            patternUnits="userSpaceOnUse"
          >
            <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid-pattern)" />
      </svg>
    </div>
  );
}

function AuthBadge({ label }: { label: string }) {
  return (
    <span className="border-primary/30 bg-primary/10 text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
      <span
        aria-hidden
        className="size-1.5 animate-pulse rounded-full bg-emerald-400"
      />
      {label}
    </span>
  );
}

function AuthShowcase({
  locale,
  preview,
  t,
  variant,
}: {
  locale: string;
  preview?: RegisterPreviewData;
  t: AuthShowcaseTranslation;
  variant: AuthVisualVariant;
}) {
  if (variant === "register")
    return <RegisterShowcase preview={preview} t={t} />;
  if (variant === "reset") return <ResetShowcase t={t} />;
  return <LoginShowcase locale={locale} t={t} />;
}

function LoginShowcase({
  locale,
  t,
}: {
  locale: string;
  t: AuthShowcaseTranslation;
}) {
  const normalizedLocale = locale === "es" || locale === "nl" ? locale : "en";

  const { data: dbPortfolios } = api.portfolio.getShowcasePortfolios.useQuery(
    { locale: normalizedLocale },
    {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  );

  const [shuffleTick, setShuffleTick] = useState(0);

  const shuffle = useCallback(() => {
    setShuffleTick((prev) => prev + 1);
  }, []);

  const displayedPortfolios = useMemo(() => {
    if (!dbPortfolios || dbPortfolios.length === 0) return [];
    if (dbPortfolios.length <= 3) return dbPortfolios;

    const count = dbPortfolios.length;
    const offset = (shuffleTick * 3) % count;
    const rotated = [
      ...dbPortfolios.slice(offset),
      ...dbPortfolios.slice(0, offset),
    ];
    return rotated.slice(0, 3);
  }, [dbPortfolios, shuffleTick]);

  const hasPortfolios = displayedPortfolios.length > 0;

  return (
    <aside className="hidden lg:block">
      <div className="border-border/60 bg-card/30 shadow-primary/10 rounded-3xl border p-8 shadow-xl backdrop-blur sm:p-10">
        <p className="text-foreground text-lg leading-snug font-medium">
          {t("heroQuote")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("heroDescription")}
        </p>
        <ShowcaseFrame label={t("badgeAdmin")}>
          <div className="grid grid-cols-2 gap-3 p-4">
            <ShowcaseCard
              icon={<BriefcaseBusiness aria-hidden />}
              label={t("previewProjects")}
            />
            <ShowcaseSkillsCard
              icon={<LayoutDashboard aria-hidden />}
              label={t("previewSkills")}
            />
            <ShowcaseCard
              icon={<FileText aria-hidden />}
              label={t("previewCertificates")}
            />
            <ShowcaseCvCard
              icon={<ArrowUpRight aria-hidden />}
              label={t("previewCv")}
            />
          </div>
        </ShowcaseFrame>

        {hasPortfolios ? (
          <>
            <div className="mt-7 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">{t("heroAuthor")}</p>
              {dbPortfolios && dbPortfolios.length > 3 ? (
                <button
                  type="button"
                  onClick={shuffle}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-medium transition-colors focus-visible:underline focus-visible:outline-none"
                  title={t("shuffle")}
                  aria-label={t("shuffle")}
                >
                  <Shuffle className="size-3" aria-hidden />
                  <span>{t("shuffle")}</span>
                </button>
              ) : null}
            </div>
            <ul className="mt-3 space-y-2.5">
              {displayedPortfolios.map((item) => (
                <PortfolioRow
                  key={item.id}
                  initials={item.initials}
                  subdomain={item.subdomain}
                  role={item.role}
                />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function RegisterShowcase({
  preview,
  t,
}: {
  preview?: RegisterPreviewData;
  t: AuthShowcaseTranslation;
}) {
  const trimmedUsername = preview?.username?.trim().toLowerCase();
  const displayUsername =
    trimmedUsername && trimmedUsername.length > 0
      ? trimmedUsername
      : "your-name";

  const trimmedName = preview?.name?.trim();
  const displayName =
    trimmedName && trimmedName.length > 0 ? trimmedName : t("previewName");

  const initials = useMemo(() => {
    const raw = (preview?.name ?? "").trim();
    if (!raw) return "?";
    const parts = raw.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [preview?.name]);

  return (
    <aside className="hidden lg:block">
      <div className="border-border/60 bg-card/30 shadow-primary/10 rounded-3xl border p-8 shadow-xl backdrop-blur sm:p-10">
        <p className="text-muted-foreground mb-4 text-sm font-medium">
          {t("communityTitle")}
        </p>
        <ShowcaseFrame
          label={t("badgePortfolio")}
          address={`${displayUsername}.jesushg.com`}
        >
          <div className="p-6">
            <div className="flex items-center gap-4">
              <span className="bg-primary/20 text-primary ring-primary/50 shadow-primary/30 grid size-14 place-items-center rounded-full text-lg font-bold shadow-lg ring-2 transition-all">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-foreground truncate text-lg font-bold">
                  {displayName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("previewRole")}
                </p>
              </div>
            </div>
            <div aria-hidden className="mt-5 space-y-2">
              <div className="bg-muted/80 h-2 w-full rounded" />
              <div className="bg-muted/70 h-2 w-5/6 rounded" />
              <div className="bg-muted/60 h-2 w-2/3 rounded" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                {t("previewProjects")}
              </span>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                {t("previewSkills")}
              </span>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                {t("previewCv")}
              </span>
            </div>
          </div>
        </ShowcaseFrame>
      </div>
    </aside>
  );
}

function ResetShowcase({ t }: { t: AuthShowcaseTranslation }) {
  return (
    <aside className="hidden lg:block">
      <div className="border-border/60 bg-card/30 shadow-primary/10 rounded-3xl border p-8 shadow-xl backdrop-blur sm:p-10">
        <div className="bg-primary/15 text-primary ring-primary/40 shadow-primary/25 grid size-12 place-items-center rounded-xl shadow-lg ring-1">
          <ShieldCheck aria-hidden className="size-6" />
        </div>
        <h2 className="text-foreground mt-6 text-xl font-semibold">
          {t("trustTitle")}
        </h2>
        <ol className="mt-6 space-y-4">
          <RecoveryStep number="1" label={t("resetStepEmail")} />
          <RecoveryStep number="2" label={t("resetStepLink")} />
          <RecoveryStep number="3" label={t("resetStepPassword")} />
        </ol>
      </div>
    </aside>
  );
}

function ShowcaseFrame({
  address,
  children,
  label,
}: {
  address?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="border-border/60 bg-background/80 shadow-primary/15 mt-6 overflow-hidden rounded-2xl border shadow-2xl">
      <div className="border-border/60 flex items-center gap-2 border-b px-4 py-2.5">
        <span aria-hidden className="size-2.5 rounded-full bg-red-400/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-amber-400/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-emerald-400/80" />
        {address ? (
          <div className="bg-muted/70 text-foreground ml-3 flex-1 truncate rounded-md px-3 py-1 text-sm">
            <span className="text-primary font-medium">
              {address.split(".")[0]}
            </span>
            .{address.split(".").slice(1).join(".")}
          </div>
        ) : (
          <span className="text-muted-foreground ml-3 text-sm">{label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function ShowcaseCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="border-border/60 bg-card/40 rounded-xl border p-3">
      <span className="text-muted-foreground mb-3 block size-4">{icon}</span>
      <p className="text-foreground text-sm font-medium">{label}</p>
      <div aria-hidden className="mt-3 space-y-2">
        <div className="bg-muted h-1.5 w-4/5 rounded" />
        <div className="bg-muted/70 h-1.5 w-3/5 rounded" />
      </div>
    </div>
  );
}

function ShowcaseSkillsCard({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="border-border/60 bg-card/40 rounded-xl border p-3">
      <span className="text-muted-foreground mb-2 block size-4">{icon}</span>
      <p className="text-foreground text-sm font-medium">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-sm font-medium">
          React
        </span>
        <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-sm font-medium">
          Node
        </span>
        <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-sm font-medium">
          SQL
        </span>
      </div>
    </div>
  );
}

function ShowcaseCvCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="border-primary/30 bg-primary/10 rounded-xl border p-3">
      <span className="text-primary mb-3 block size-4">{icon}</span>
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-foreground">{label}</span>
        <span className="bg-primary/20 text-primary rounded px-1.5 text-sm font-medium">
          Beta
        </span>
      </div>
      <div aria-hidden className="mt-3 space-y-2">
        <div className="bg-primary/30 h-1.5 w-3/4 rounded" />
        <div className="bg-primary/20 h-1.5 w-1/2 rounded" />
      </div>
    </div>
  );
}

function RecoveryStep({ label, number }: { label: string; number: string }) {
  return (
    <li className="text-foreground flex items-center gap-3.5 text-sm">
      <span className="bg-primary/15 text-primary grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold">
        {number}
      </span>
      <span className="text-muted-foreground leading-snug">{label}</span>
    </li>
  );
}

function PortfolioRow({
  initials,
  subdomain,
  role,
}: {
  initials: string;
  subdomain: string;
  role?: string | null;
}) {
  const isCustomDomain = subdomain.includes(".");

  return (
    <li className="text-foreground flex items-center gap-3 text-sm">
      <span className="bg-primary/20 text-primary ring-primary/40 grid size-9 place-items-center rounded-full text-sm font-bold ring-1">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="truncate">
          <span className="text-primary font-medium">{subdomain}</span>
          {!isCustomDomain ? (
            <span className="text-muted-foreground">.jesushg.com</span>
          ) : null}
        </div>
        {role ? (
          <div className="text-muted-foreground truncate text-sm">{role}</div>
        ) : null}
      </div>
    </li>
  );
}
