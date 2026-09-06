import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { ProcessPageView } from "@/features/process-pages/components/process-page-view";
import { api } from "@/trpc/server";

export { generateMetadata } from "./metadata";

interface ProcessPageRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function ProcessPageRoute({
  params,
}: ProcessPageRouteProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const page = await api.processPages.getBySlug({ slug, locale });

  if (!page) notFound();

  return <ProcessPageView page={page} />;
}
