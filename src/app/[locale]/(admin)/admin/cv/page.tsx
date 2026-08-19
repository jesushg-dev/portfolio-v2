export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";

import CvEditor from "./cv-editor";

interface ICvPageProps {
  params: Promise<{ locale: string }>;
}

const CvPage: FC<ICvPageProps> = async ({ params }) => {
  const { locale } = await params;

  return <CvEditor defaultLocale={(locale as Locale) || "en"} />;
};

export default CvPage;
