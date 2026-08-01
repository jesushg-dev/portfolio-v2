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
import type { IconType } from "react-icons/lib";

export const SOFT_SKILL_ICON_OPTIONS = {
  RiTeamLine: RiTeamLine,
  RiShieldStarLine: RiShieldStarLine,
  RiMedal2Line: RiMedal2Line,
  RiSettingsLine: RiSettingsLine,
  RiTimerFlashLine: RiTimerFlashLine,
  RiHandHeartLine: RiHandHeartLine,
  RiMapPinTimeLine: RiMapPinTimeLine,
  RiDashboard3Line: RiDashboard3Line,
  RiEmotion2Line: RiEmotion2Line,
  RiQuillPenLine: RiQuillPenLine,
  RiCalendarTodoLine: RiCalendarTodoLine,
  RiUserStarLine: RiUserStarLine,
  RiGroupLine: RiGroupLine,
  RiLightbulbLine: RiLightbulbLine,
  RiBarChartLine: RiBarChartLine,
} as const satisfies Record<string, IconType>;

export type SoftSkillIconKey = keyof typeof SOFT_SKILL_ICON_OPTIONS;

export const SOFT_SKILL_ICON_KEYS = Object.keys(
  SOFT_SKILL_ICON_OPTIONS,
) as SoftSkillIconKey[];

const DEFAULT_ICON: SoftSkillIconKey = "RiTeamLine";

export function resolveSoftSkillIcon(key: string): IconType {
  if (key in SOFT_SKILL_ICON_OPTIONS) {
    return SOFT_SKILL_ICON_OPTIONS[key as SoftSkillIconKey];
  }
  return SOFT_SKILL_ICON_OPTIONS[DEFAULT_ICON];
}

export function isSoftSkillIconKey(key: string): key is SoftSkillIconKey {
  return key in SOFT_SKILL_ICON_OPTIONS;
}
