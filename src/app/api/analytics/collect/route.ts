import { handleAnalyticsCollect } from "@/features/analytics/server/collect";

export async function POST(request: Request) {
  return handleAnalyticsCollect(request);
}
