import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { Link } from "@/i18n/routing";

import type { NavItem, NavStat } from "./navigation-config";
import { homeSectionHref } from "./navigation-config";
import { processPageHref } from "@/lib/process-pages/process-page-href";

export type NavItemHref = ComponentProps<typeof Link>["href"];

export interface ResolvedNavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  short: string;
  headline: string;
  description: string;
  chips: string[];
  stat?: NavStat;
  cta: string;
  href: NavItemHref;
  comingSoon: boolean;
}

export type NavTranslator = ReturnType<
  typeof useTranslations<"global.header.nav">
>;

export function resolveNavItem(
  item: NavItem,
  t: NavTranslator,
): ResolvedNavItem {
  const has = (key: string) => (t.has ? t.has(key as never) : true);
  const get = (key: string, fallback: string) => {
    try {
      if (has(key)) {
        const val = t(key as never);
        if (val && !val.includes(key)) return val;
      }
    } catch {
      // Fallback below
    }
    return fallback;
  };

  const getRawChips = (key: string): string[] => {
    try {
      if (t.raw) {
        const rawVal: unknown = t.raw(key as never);
        if (Array.isArray(rawVal)) {
          return rawVal.map((v: unknown) => String(v));
        }
      }
    } catch {
      // Fallback
    }
    return item.chips ?? [];
  };

  const itemKey = `items.${item.id}`;
  const baseLabel =
    item.kind === "process" ? item.label : get(`${itemKey}.label`, item.id);

  const baseDescription =
    item.kind === "process"
      ? item.description
      : get(`${itemKey}.description`, "");

  const short = get(`${itemKey}.short`, baseDescription || baseLabel);
  const headline = get(`${itemKey}.headline`, baseLabel);
  const description = get(`${itemKey}.description`, baseDescription);
  const chips = getRawChips(`${itemKey}.chips`);

  const statValue = get(`${itemKey}.statValue`, item.stat?.value ?? "");
  const statLabel = get(`${itemKey}.statLabel`, item.stat?.label ?? "");
  const stat: NavStat | undefined =
    statValue && statLabel ? { value: statValue, label: statLabel } : item.stat;

  const defaultCta = t.has?.("explore" as never)
    ? t("explore" as never)
    : "Explore";
  const cta = get(`${itemKey}.cta`, defaultCta);

  let href: NavItemHref = "/";
  if (item.kind === "section") {
    href = homeSectionHref(item.sectionId);
  } else if (item.kind === "process") {
    href = processPageHref(item.slug);
  } else {
    href = item.href;
  }

  const comingSoon = item.kind === "route" && Boolean(item.comingSoon);

  return {
    id: item.id,
    icon: item.icon,
    label: baseLabel,
    short,
    headline,
    description,
    chips,
    stat,
    cta,
    href,
    comingSoon,
  };
}
