import { ScheduleModal } from "@/features/home/components/schedule/schedule-modal";
import { getScheduleCalendlyUrl } from "@/features/home/components/schedule/get-schedule-calendly-url";

export default async function Page() {
  const calendlyUrl = await getScheduleCalendlyUrl();
  if (!calendlyUrl) return null;

  return <ScheduleModal calendlyUrl={calendlyUrl} />;
}
