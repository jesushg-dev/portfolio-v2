import type { FC } from "react";

import type { Locale } from "next-intl";

export { generateMetadata } from "./metadata";

import Certification from "@/components/certification/certification";
import type { stackTypes } from "@/utils/constants/certificates-type";

interface ICvPageProps {
  params: Promise<{
    locale: Locale;
    slug: [(typeof stackTypes)[number]];
  }>;
}

const CvPage: FC<ICvPageProps> = async ({ params }) => {
  const { slug } = await params;

  return <Certification slug={slug} />;
};

export default CvPage;
