import {
  Bot,
  CalendarDays,
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
  category: "communication" | "media" | "storage" | "ai";
}

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: "spotify",
    icon: Music2,
    accentClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    category: "media",
  },
  {
    id: "resend",
    icon: Mail,
    accentClass: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    badgeClass: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    category: "communication",
  },
  {
    id: "google-calendar",
    icon: CalendarDays,
    accentClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    category: "communication",
  },
  {
    id: "uploadthing",
    icon: HardDrive,
    accentClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    category: "storage",
  },
  {
    id: "ai",
    icon: Bot,
    accentClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    category: "ai",
  },
];
