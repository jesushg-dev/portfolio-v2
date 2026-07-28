import { Bot, HardDrive, Mail, Music2, type LucideIcon } from "lucide-react";

import type { IntegrationProvider } from "@/lib/integrations/tenant-integrations-service";

export interface IntegrationCatalogItem {
  id: IntegrationProvider;
  icon: LucideIcon;
}

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  { id: "resend", icon: Mail },
  { id: "spotify", icon: Music2 },
  { id: "uploadthing", icon: HardDrive },
  { id: "ai", icon: Bot },
];
