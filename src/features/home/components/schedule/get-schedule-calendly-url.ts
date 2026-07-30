import "server-only";

import { api } from "@/trpc/server";
import { getCalendlyUrl } from "@/utils/calendly-url";

export async function getScheduleCalendlyUrl(): Promise<string | null> {
  const data = await api.contact.getPublic();
  return getCalendlyUrl(data.contacts);
}
