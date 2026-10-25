import {
  Bot,
  CalendarDays,
  FileText,
  HardDrive,
  Mail,
  Music2,
  type LucideIcon,
} from "lucide-react";

import type { IntegrationProvider } from "@/lib/integrations/tenant-integrations-service";

export interface IntegrationCatalogItem {
  id: IntegrationProvider;
  icon: LucideIcon;
  accentClass: string;
  badgeClass: string;
  category: "communication" | "media" | "storage" | "ai" | "documents";
}

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: "spotify",
    icon: Music2,
    accentClass:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
    category: "media",
  },
  {
    id: "resend",
    icon: Mail,
    accentClass:
      "border-violet-500/25 bg-violet-500/10 text-violet-500 ring-violet-500/20",
    badgeClass: "border-violet-500/25 bg-violet-500/10 text-violet-600",
    category: "communication",
  },
  {
    id: "google-calendar",
    icon: CalendarDays,
    accentClass:
      "border-blue-500/25 bg-blue-500/10 text-blue-500 ring-blue-500/20",
    badgeClass: "border-blue-500/25 bg-blue-500/10 text-blue-600",
    category: "communication",
  },
  {
    id: "uploadthing",
    icon: HardDrive,
    accentClass:
      "border-amber-500/25 bg-amber-500/10 text-amber-500 ring-amber-500/20",
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-600",
    category: "storage",
  },
  {
    id: "ai",
    icon: Bot,
    accentClass:
      "border-purple-500/25 bg-purple-500/10 text-purple-500 ring-purple-500/20",
    badgeClass: "border-purple-500/25 bg-purple-500/10 text-purple-600",
    category: "ai",
  },
  {
    id: "ilovepdf",
    icon: FileText,
    accentClass:
      "border-rose-500/25 bg-rose-500/10 text-rose-500 ring-rose-500/20",
    badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-600",
    category: "documents",
  },
];
