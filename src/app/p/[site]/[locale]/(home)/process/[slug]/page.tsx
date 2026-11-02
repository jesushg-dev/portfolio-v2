import { getPublicLocale } from "@/lib/public-site/locale";
import { notFound } from "next/navigation";

import { ProcessPageView } from "@/features/process-pages/components/process-page-view";
import { api } from "@/trpc/server";
export { publicProcessParams as generateStaticParams } from "@/lib/public-site/static-params";

export { generateMetadata } from "./metadata";

interface ProcessPageRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function ProcessPageRoute({
  params,
}: ProcessPageRouteProps) {
  const { slug } = await params;
  const locale = await getPublicLocale();
  const page = await api.processPages.getBySlug({ slug, locale });

  if (!page) notFound();

  return <ProcessPageView page={page} />;
}
