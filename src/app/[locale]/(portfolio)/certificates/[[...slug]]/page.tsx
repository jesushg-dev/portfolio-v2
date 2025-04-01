import React from "react";
import type { FC } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "next-intl";
import Certification from "@/components/certification/certification";
import type { stackTypes } from "@/utils/constants/certificatesType";

interface ICvPageProps {
  params: Promise<{
    locale: Locale;
    slug: [(typeof stackTypes)[number]];
  }>;
}

const CvPage: FC<ICvPageProps> = async ({ params }) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <Certification slug={slug} />;
};

export async function generateMetadata({
  params,
}: Omit<ICvPageProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "certification" });

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    metadataBase: new URL("https://www.jesushg.com"),
  };
}

export default CvPage;
