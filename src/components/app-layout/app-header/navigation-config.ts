import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  FileText,
  Layers,
  LayoutGrid,
  MessageSquareQuote,
  MonitorSmartphone,
  Radio,
  ScrollText,
  Server,
  Sparkles,
  User,
} from "lucide-react";

import { resolveProcessPageIcon } from "@/lib/process-pages/process-page-icons";
import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";

export type StaticNavPath =
  | "/projects"
  | "/certificates"
  | "/curriculum-vitae"
  | "/timeline"
  | "/uses"
  | "/now"
  | "/colophon"
  | "/stats";

export type NavSectionId =
  | "home"
  | "about"
  | "experience"
  | "skills"
  | "services"
  | "soft-skills"
  | "testimonials"
  | "portfolio"
  | "contact";

export interface NavStat {
  value: string;
  label: string;
}

export interface NavLinkItem {
  kind: "section";
  id: string;
  sectionId: NavSectionId;
  icon: LucideIcon;
  chips?: string[];
  stat?: NavStat;
}

export interface NavRouteItem {
  kind: "route";
  id: string;
  href: StaticNavPath;
  icon: LucideIcon;
  comingSoon?: boolean;
  chips?: string[];
  stat?: NavStat;
}

export interface NavProcessItem {
  kind: "process";
  id: string;
  slug: string;
  icon: LucideIcon;
  label: string;
  description: string;
  chips?: string[];
  stat?: NavStat;
}

export type NavItem = NavLinkItem | NavRouteItem | NavProcessItem;

export function homeSectionHref(sectionId: NavSectionId) {
  return { pathname: "/" as const, hash: `#${sectionId}` };
}

export interface NavGroup {
  id: "about" | "portfolio" | "process";
  icon: LucideIcon;
  items: NavItem[];
}

export const PROCESS_STATIC_ITEMS: NavItem[] = [
  {
    kind: "route",
    id: "stats",
    href: "/stats",
    icon: BarChart3,
    comingSoon: false,
    chips: ["Analytics", "Performance", "Demographics"],
    stat: { value: "Live", label: "site telemetry" },
  },
  {
    kind: "route",
    id: "colophon",
    href: "/colophon",
    icon: ScrollText,
    comingSoon: false,
    chips: ["Next.js 15", "Tailwind CSS", "TypeScript", "Performance"],
    stat: { value: "v2.0", label: "portfolio build" },
  },
  {
    kind: "route",
    id: "uses",
    href: "/uses",
    icon: MonitorSmartphone,
    comingSoon: true,
    chips: ["Hardware", "Workstation", "Dev tools", "Terminal"],
    stat: { value: "Daily", label: "developer tools" },
  },
  {
    kind: "route",
    id: "now",
    href: "/now",
    icon: Radio,
    comingSoon: false,
    chips: ["Current focus", "Reading", "Active projects"],
    stat: { value: "Live", label: "current status" },
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "about",
    icon: User,
    items: [
      {
        kind: "section",
        id: "about",
        sectionId: "about",
        icon: User,
        chips: ["Profile summary", "Engineering philosophy", "Ownership"],
        stat: { value: "6+", label: "years of experience" },
      },
      {
        kind: "section",
        id: "services",
        sectionId: "services",
        icon: Server,
        chips: [
          "System architecture",
          "Legacy modernization",
          "Core development",
        ],
        stat: { value: "3", label: "specialties" },
      },
      {
        kind: "section",
        id: "soft-skills",
        sectionId: "soft-skills",
        icon: Sparkles,
        chips: ["Team leadership", "Mentorship", "Communication"],
        stat: { value: "6", label: "engineers led" },
      },
      {
        kind: "section",
        id: "testimonials",
        sectionId: "testimonials",
        icon: MessageSquareQuote,
        chips: ["Testimonials", "Senior developers", "Recommendations"],
        stat: { value: "100%", label: "positive feedback" },
      },
      {
        kind: "section",
        id: "skills",
        sectionId: "skills",
        icon: Layers,
        chips: [".NET", "C#", "Microservices", "Cloud"],
        stat: { value: "4", label: "core areas" },
      },
      {
        kind: "section",
        id: "experience",
        sectionId: "experience",
        icon: Briefcase,
        chips: ["Senior Software Engineer", "Tech Lead", "Full Stack"],
        stat: { value: "20+", label: "projects delivered" },
      },
    ],
  },
  {
    id: "portfolio",
    icon: LayoutGrid,
    items: [
      {
        kind: "route",
        id: "projects",
        href: "/projects",
        icon: LayoutGrid,
        chips: ["APIs", "E-commerce", "Admin platforms", "Cloud"],
        stat: { value: "15+", label: "featured projects" },
      },
      {
        kind: "route",
        id: "certificates",
        href: "/certificates",
        icon: Award,
        chips: ["Frontend", "Backend", "Cybersecurity", "Soft skills"],
        stat: { value: "30+", label: "certifications" },
      },
      {
        kind: "route",
        id: "curriculum",
        href: "/curriculum-vitae",
        icon: FileText,
        chips: ["Interactive CV", "PDF export", "Work history"],
        stat: { value: "2026", label: "current resume" },
      },
      {
        kind: "route",
        id: "timeline",
        href: "/timeline",
        icon: Calendar,
        chips: ["Career milestones", "Progression", "Growth"],
        stat: { value: "6+", label: "years evolution" },
      },
    ],
  },
  {
    id: "process",
    icon: Bot,
    items: PROCESS_STATIC_ITEMS,
  },
];

export function processPagesToNavItems(
  pages: ProcessNavPage[],
): NavProcessItem[] {
  return pages.map((page) => ({
    kind: "process",
    id: page.id,
    slug: page.slug,
    icon: resolveProcessPageIcon(page.navIcon),
    label: page.menuTitle.trim() || page.slug,
    description: page.navDescription.trim(),
  }));
}

export function navGroupsForPublicSite(
  cvPublic: boolean,
  processPages: ProcessNavPage[] = [],
): NavGroup[] {
  const processItems: NavItem[] = [
    ...processPagesToNavItems(processPages),
    ...PROCESS_STATIC_ITEMS,
  ];

  const groups = NAV_GROUPS.map((group) =>
    group.id === "process" ? { ...group, items: processItems } : group,
  );

  if (cvPublic) return groups;
  return groups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !(item.kind === "route" && item.href === "/curriculum-vitae"),
    ),
  }));
}
