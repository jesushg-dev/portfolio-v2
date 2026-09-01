import type { ApplicationStatus } from "@/features/job-tracker/lib/application-editor-dto";

export const statusVariants: Record<
  ApplicationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPLIED: "outline",
  INTERVIEW: "default",
  OFFER: "secondary",
  GHOSTED: "secondary",
  REJECTED: "destructive",
  HIRED: "default",
};

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "GHOSTED",
  "HIRED",
  "REJECTED",
];

export const kanbanColumnStyles: Record<
  ApplicationStatus,
  { dot: string; accent: string; avatar: string }
> = {
  APPLIED: {
    dot: "bg-primary",
    accent: "border-l-primary",
    avatar: "bg-primary/15 text-primary",
  },
  INTERVIEW: {
    dot: "bg-amber-500",
    accent: "border-l-amber-500",
    avatar: "bg-amber-500/15 text-amber-700",
  },
  OFFER: {
    dot: "bg-emerald-500",
    accent: "border-l-emerald-500",
    avatar: "bg-emerald-500/15 text-emerald-700",
  },
  GHOSTED: {
    dot: "bg-muted-foreground",
    accent: "border-l-muted-foreground",
    avatar: "bg-muted text-muted-foreground",
  },
  HIRED: {
    dot: "bg-emerald-600",
    accent: "border-l-emerald-600",
    avatar: "bg-emerald-600/15 text-emerald-800",
  },
  REJECTED: {
    dot: "bg-destructive",
    accent: "border-l-destructive",
    avatar: "bg-destructive/15 text-destructive",
  },
};
