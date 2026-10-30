import CvPageView from "../(home)/curriculum-vitae/cv-page-view";
import { getPublicLocale } from "@/lib/public-site/locale";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function CvRenderPage({
  searchParams,
}: {
  searchParams: Promise<{ paginate?: string; design?: string }>;
}) {
  const locale = await getPublicLocale();
  const { paginate, design } = await searchParams;
  return (
    <CvPageView
      locale={locale}
      pdfMode
      paginatePdfPages={paginate === "1"}
      design={design}
    />
  );
}
