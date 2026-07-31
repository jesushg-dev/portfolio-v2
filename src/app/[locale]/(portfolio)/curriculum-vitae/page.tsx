import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export { generateMetadata } from "./metadata";

import CvPageView from "./cv-page-view";

export const dynamic = "force-dynamic";

interface ICvPageProps {
  params: Promise<{ locale: string }>;
}

interface ICvPageSearchProps extends ICvPageProps {
  searchParams: Promise<{ pdf?: string; paginate?: string }>;
}

export default async function CvPage({
  params,
  searchParams,
}: ICvPageSearchProps) {
  const { locale } = await params;
  const { pdf, paginate } = await searchParams;
  setRequestLocale(locale as Locale);

  return (
    <CvPageView
      locale={locale}
      pdfMode={pdf === "1"}
      paginatePdfPages={paginate === "1"}
    />
  );
}
