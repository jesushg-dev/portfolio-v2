import {
  Award,
  BarChart3,
  CalendarCheck,
  HeartHandshake,
  LayoutGrid,
  Lightbulb,
  MapPin,
  PenTool,
  Settings,
  ShieldCheck,
  Smile,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";
import { resolveIcon, type IconComponent } from "@/lib/icons/icon-registry";

export const SOFT_SKILL_ICON_OPTIONS = {
  RiTeamLine: Users,
  RiShieldStarLine: ShieldCheck,
  RiMedal2Line: Award,
  RiSettingsLine: Settings,
  RiTimerFlashLine: Timer,
  RiHandHeartLine: HeartHandshake,
  RiMapPinTimeLine: MapPin,
  RiDashboard3Line: LayoutGrid,
  RiEmotion2Line: Smile,
  RiQuillPenLine: PenTool,
  RiCalendarTodoLine: CalendarCheck,
  RiUserStarLine: UserCheck,
  RiGroupLine: Users,
  RiLightbulbLine: Lightbulb,
  RiBarChartLine: BarChart3,
} as const satisfies Record<string, IconComponent>;

export type SoftSkillIconKey = keyof typeof SOFT_SKILL_ICON_OPTIONS;

export const SOFT_SKILL_ICON_KEYS = Object.keys(
  SOFT_SKILL_ICON_OPTIONS,
) as SoftSkillIconKey[];

const DEFAULT_ICON: SoftSkillIconKey = "RiTeamLine";

export function resolveSoftSkillIcon(key: string): IconComponent {
  return resolveIcon(key, SOFT_SKILL_ICON_OPTIONS[DEFAULT_ICON]);
}

export function isSoftSkillIconKey(key: string): key is SoftSkillIconKey {
  return key in SOFT_SKILL_ICON_OPTIONS;
}
