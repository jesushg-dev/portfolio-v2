import type { LucideIcon } from "lucide-react";

export interface ProcessNavItem {
  id: string;
  label: string;
}

export interface ProcessBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  detail?: string;
  tools?: string;
}

export interface ProcessFaqItem {
  question: string;
  answer: string;
}

export interface ProcessTool {
  id: string;
  name: string;
  initials: string;
  description: string;
}

export interface ProcessHeroAction {
  label: string;
  href: string;
}

export interface ProcessScheduleAction {
  label: string;
  href: "/schedule";
}
