export { generateMetadata } from "./metadata";

import CvPageView from "./cv-page-view";

export const dynamic = "force-dynamic";

interface ICvPageProps {
  params: Promise<{ locale: string }>;
}

interface ICvPageSearchProps extends ICvPageProps {
  searchParams: Promise<{ pdf?: string; paginate?: string; design?: string }>;
}

export default async function CvPage({
  params,
  searchParams,
}: ICvPageSearchProps) {
  const { locale } = await params;
  const { pdf, paginate, design } = await searchParams;

  return (
    <CvPageView
      locale={locale}
      pdfMode={pdf === "1"}
      paginatePdfPages={paginate === "1"}
      design={design}
    />
  );
}
