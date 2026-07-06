import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import CvEditor from "./cv-editor";

interface ICvPageProps {
  params: Promise<{ locale: string }>;
}

const CvPage: FC<ICvPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <CvEditor />;
};

export default CvPage;
