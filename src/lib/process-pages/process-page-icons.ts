import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CheckCircle,
  Eye,
  Handshake,
  HeartHandshake,
  Layers,
  ListChecks,
  MessageCircle,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";

/** Lucide icon names allowed for header/footer nav and benefit cards. */
export const PROCESS_PAGE_ICON_NAMES = [
  "Bot",
  "HeartHandshake",
  "Zap",
  "Layers",
  "Eye",
  "ShieldCheck",
  "Target",
  "CheckCircle",
  "Handshake",
  "Users",
  "Workflow",
  "Sparkles",
  "Wrench",
  "ListChecks",
  "MessageCircle",
  "Rocket",
  "MonitorSmartphone",
] as const;

export type ProcessPageIconName = (typeof PROCESS_PAGE_ICON_NAMES)[number];

export function isProcessPageIconName(
  value: unknown,
): value is ProcessPageIconName {
  return (
    typeof value === "string" &&
    (PROCESS_PAGE_ICON_NAMES as readonly string[]).includes(value)
  );
}

const PROCESS_PAGE_ICONS: Record<ProcessPageIconName, LucideIcon> = {
  Bot,
  HeartHandshake,
  Zap,
  Layers,
  Eye,
  ShieldCheck,
  Target,
  CheckCircle,
  Handshake,
  Users,
  Workflow,
  Sparkles,
  Wrench,
  ListChecks,
  MessageCircle,
  Rocket,
  MonitorSmartphone,
};

export const PROCESS_PAGE_ICON_MAP = PROCESS_PAGE_ICONS;

export function resolveProcessPageIcon(
  name: string | null | undefined,
): LucideIcon {
  return isProcessPageIconName(name) ? PROCESS_PAGE_ICON_MAP[name] : Bot;
}
