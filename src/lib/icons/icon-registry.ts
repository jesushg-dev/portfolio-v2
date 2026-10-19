import type { ComponentType } from "react";
import {
  Award,
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Eye,
  FileText,
  Gauge,
  Globe,
  Globe2,
  KeyRound,
  Layers,
  Layers3,
  LayoutGrid,
  Lock,
  Mail,
  Music2,
  Palette,
  Radio,
  Search,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Terminal,
  Truck,
  User,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import {
  RiDashboard3Line,
  RiEmotion2Line,
  RiHandHeartLine,
  RiMapPinTimeLine,
  RiMedal2Line,
  RiQuillPenLine,
  RiSettingsLine,
  RiShieldStarLine,
  RiTeamLine,
  RiTimerFlashLine,
  RiCalendarTodoLine,
  RiUserStarLine,
  RiGroupLine,
  RiLightbulbLine,
  RiBarChartLine,
} from "react-icons/ri";

/**
 * Universal icon component type compatible with Lucide, React Icons, and SVG wrappers.
 */
export type IconComponent = ComponentType<{
  className?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export interface IconOption {
  key: string;
  label: string;
  icon: IconComponent;
  category: "case-study" | "service" | "soft-skill";
}

/**
 * Service icon catalog (used in Services Bento and Service admin forms).
 */
export const SERVICE_ICON_OPTIONS: IconOption[] = [
  { key: "code", label: "Code / Frontend", icon: Code2, category: "service" },
  { key: "server", label: "Server / Backend", icon: Server, category: "service" },
  { key: "smartphone", label: "Mobile Apps", icon: Smartphone, category: "service" },
  { key: "terminal", label: "Terminal / DevOps", icon: Terminal, category: "service" },
  { key: "shield", label: "Security", icon: ShieldCheck, category: "service" },
  { key: "database", label: "Database", icon: Database, category: "service" },
  { key: "zap", label: "Performance / Zap", icon: Zap, category: "service" },
  { key: "globe", label: "Web / Global", icon: Globe, category: "service" },
  { key: "layers", label: "Architecture / Layers", icon: Layers, category: "service" },
];

/**
 * Soft skill icon catalog (used in Soft Skills Bento and Soft Skill admin forms).
 */
export const SOFT_SKILL_ICON_OPTIONS_LIST: IconOption[] = [
  { key: "RiTeamLine", label: "Teamwork", icon: RiTeamLine, category: "soft-skill" },
  { key: "RiShieldStarLine", label: "Integrity", icon: RiShieldStarLine, category: "soft-skill" },
  { key: "RiMedal2Line", label: "Leadership", icon: RiMedal2Line, category: "soft-skill" },
  { key: "RiSettingsLine", label: "Problem Solving", icon: RiSettingsLine, category: "soft-skill" },
  { key: "RiTimerFlashLine", label: "Adaptability", icon: RiTimerFlashLine, category: "soft-skill" },
  { key: "RiHandHeartLine", label: "Empathy", icon: RiHandHeartLine, category: "soft-skill" },
  { key: "RiMapPinTimeLine", label: "Punctuality", icon: RiMapPinTimeLine, category: "soft-skill" },
  { key: "RiDashboard3Line", label: "Organization", icon: RiDashboard3Line, category: "soft-skill" },
  { key: "RiEmotion2Line", label: "Positivity", icon: RiEmotion2Line, category: "soft-skill" },
  { key: "RiQuillPenLine", label: "Communication", icon: RiQuillPenLine, category: "soft-skill" },
  { key: "RiCalendarTodoLine", label: "Planning", icon: RiCalendarTodoLine, category: "soft-skill" },
  { key: "RiUserStarLine", label: "Mentorship", icon: RiUserStarLine, category: "soft-skill" },
  { key: "RiGroupLine", label: "Collaboration", icon: RiGroupLine, category: "soft-skill" },
  { key: "RiLightbulbLine", label: "Innovation", icon: RiLightbulbLine, category: "soft-skill" },
  { key: "RiBarChartLine", label: "Results-driven", icon: RiBarChartLine, category: "soft-skill" },
];

/**
 * Case Study & Project Gallery icon catalog.
 */
export const CASE_STUDY_ICON_OPTIONS: IconOption[] = [
  { key: "badge", label: "Badge / Award", icon: Award, category: "case-study" },
  { key: "bag", label: "Shopping Bag", icon: ShoppingBag, category: "case-study" },
  { key: "bolt", label: "Bolt / Sparkles", icon: Sparkles, category: "case-study" },
  { key: "calendar", label: "Calendar", icon: Calendar, category: "case-study" },
  { key: "case", label: "Business Case", icon: BriefcaseBusiness, category: "case-study" },
  { key: "chart", label: "Analytics / Chart", icon: BarChart3, category: "case-study" },
  { key: "check", label: "Checkmark", icon: CheckCircle2, category: "case-study" },
  { key: "code", label: "Code", icon: Code2, category: "case-study" },
  { key: "cpu", label: "CPU / Architecture", icon: Cpu, category: "case-study" },
  { key: "db", label: "Database", icon: Database, category: "case-study" },
  { key: "eye", label: "Vision / Preview", icon: Eye, category: "case-study" },
  { key: "file", label: "File / Document", icon: FileText, category: "case-study" },
  { key: "gauge", label: "Gauge / Metrics", icon: Gauge, category: "case-study" },
  { key: "globe", label: "Globe", icon: Globe2, category: "case-study" },
  { key: "key", label: "Key / Credentials", icon: KeyRound, category: "case-study" },
  { key: "layers", label: "Layers / Stack", icon: Layers3, category: "case-study" },
  { key: "layout", label: "Layout Grid", icon: LayoutGrid, category: "case-study" },
  { key: "lock", label: "Lock / Security", icon: Lock, category: "case-study" },
  { key: "mail", label: "Mail / Contact", icon: Mail, category: "case-study" },
  { key: "music", label: "Music / Audio", icon: Music2, category: "case-study" },
  { key: "pal", label: "Palette / Design", icon: Palette, category: "case-study" },
  { key: "radio", label: "Broadcast / Radio", icon: Radio, category: "case-study" },
  { key: "search", label: "Search", icon: Search, category: "case-study" },
  { key: "server", label: "Server", icon: Server, category: "case-study" },
  { key: "settings", label: "Settings", icon: Settings, category: "case-study" },
  { key: "shield", label: "Shield / Security", icon: ShieldCheck, category: "case-study" },
  { key: "smartphone", label: "Smartphone / Mobile", icon: Smartphone, category: "case-study" },
  { key: "store", label: "Store / Retail", icon: Store, category: "case-study" },
  { key: "term", label: "Terminal", icon: Terminal, category: "case-study" },
  { key: "truck", label: "Truck / Logistics", icon: Truck, category: "case-study" },
  { key: "user", label: "User", icon: User, category: "case-study" },
  { key: "users", label: "Users / Community", icon: Users, category: "case-study" },
  { key: "workflow", label: "Workflow / Pipeline", icon: Workflow, category: "case-study" },
  { key: "zap", label: "Zap / Speed", icon: Zap, category: "case-study" },
];

/**
 * Universal registry combining all icons from all domains with normalized lookup.
 */
export const UNIVERSAL_ICON_MAP: Record<string, IconComponent> = {
  // Case Study & General Lucide Icons
  badge: Award,
  bag: ShoppingBag,
  bolt: Sparkles,
  calendar: Calendar,
  case: BriefcaseBusiness,
  chart: BarChart3,
  check: CheckCircle2,
  code: Code2,
  cpu: Cpu,
  db: Database,
  database: Database,
  eye: Eye,
  file: FileText,
  gauge: Gauge,
  globe: Globe2,
  key: KeyRound,
  layers: Layers3,
  layout: LayoutGrid,
  lock: Lock,
  mail: Mail,
  music: Music2,
  pal: Palette,
  radio: Radio,
  search: Search,
  server: Server,
  settings: Settings,
  shield: ShieldCheck,
  smartphone: Smartphone,
  sparkles: Sparkles,
  store: Store,
  term: Terminal,
  terminal: Terminal,
  truck: Truck,
  user: User,
  users: Users,
  workflow: Workflow,
  zap: Zap,

  // Soft Skill React Icons
  RiTeamLine,
  RiShieldStarLine,
  RiMedal2Line,
  RiSettingsLine,
  RiTimerFlashLine,
  RiHandHeartLine,
  RiMapPinTimeLine,
  RiDashboard3Line,
  RiEmotion2Line,
  RiQuillPenLine,
  RiCalendarTodoLine,
  RiUserStarLine,
  RiGroupLine,
  RiLightbulbLine,
  RiBarChartLine,
};

export const DEFAULT_FALLBACK_ICON: IconComponent = Sparkles;

export type IconPreset = "all" | "service" | "soft-skill" | "case-study";

/**
 * Resolves any registered icon key to its corresponding component.
 * Fallbacks gracefully to DEFAULT_FALLBACK_ICON or a custom provided fallback.
 */
export function resolveIcon(
  key?: string | null,
  fallback: IconComponent = DEFAULT_FALLBACK_ICON,
): IconComponent {
  if (!key) return fallback;

  // Direct lookup
  if (key in UNIVERSAL_ICON_MAP) {
    return UNIVERSAL_ICON_MAP[key];
  }

  // Normalized lower-case lookup
  const normalized = key.toLowerCase();
  if (normalized in UNIVERSAL_ICON_MAP) {
    return UNIVERSAL_ICON_MAP[normalized];
  }

  return fallback;
}

/**
 * Checks whether an icon key is registered in the universal map.
 */
export function isUniversalIconKey(key: string): boolean {
  return key in UNIVERSAL_ICON_MAP || key.toLowerCase() in UNIVERSAL_ICON_MAP;
}

/**
 * Returns available icon options filtered by domain preset.
 */
export function getIconOptions(preset: IconPreset = "all"): IconOption[] {
  switch (preset) {
    case "service":
      return SERVICE_ICON_OPTIONS;
    case "soft-skill":
      return SOFT_SKILL_ICON_OPTIONS_LIST;
    case "case-study":
      return CASE_STUDY_ICON_OPTIONS;
    case "all":
    default: {
      const seen = new Set<string>();
      const combined: IconOption[] = [];
      for (const opt of [
        ...SERVICE_ICON_OPTIONS,
        ...CASE_STUDY_ICON_OPTIONS,
        ...SOFT_SKILL_ICON_OPTIONS_LIST,
      ]) {
        if (!seen.has(opt.key)) {
          seen.add(opt.key);
          combined.push(opt);
        }
      }
      return combined;
    }
  }
}
