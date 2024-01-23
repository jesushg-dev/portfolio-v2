import React from "react";
import type { FC } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import {
  unstable_setRequestLocale as UnstableSetRequestLocale,
  getTranslations,
} from "next-intl/server";

import Layout from "@/components/Layout";
import Certification from "@/components/Certification";
import HeaderArticle from "@/components/Common/HeaderArticle";
import { stackTypes } from "@/utils/constants/certificatesType";

interface ICvPageProps {
  params: {
    locale: string;
    slug: (typeof stackTypes)[number];
  };
}

const CvPage: FC<ICvPageProps> = ({ params }) => {
  // Enable static rendering
  UnstableSetRequestLocale(params.locale);
  const t = useTranslations("certification");

  return (
    <Layout headerAlwaysVisible>
      <div className="overflow-hidden">
        <section
          id="certifications"
          className="relative mx-auto px-4 pb-6 pt-20 lg:container lg:px-20 lg:pb-20"
        >
          <div className="absolute -inset-x-10 top-0 h-96 rotate-180 text-gray-500/20 opacity-60 [mask-image:linear-gradient(to_bottom,transparent,white)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <pattern
                  height={32}
                  id="grid-pattern"
                  patternTransform="translate(0 -1)"
                  patternUnits="userSpaceOnUse"
                  width={32}
                  x="50%"
                  y="100%"
                >
                  <path d="M0 32V.5H32" fill="none" stroke="currentColor" />
                </pattern>
              </defs>
              <rect fill="url(#grid-pattern)" height="100%" width="100%" />
            </svg>
          </div>
          <div className="container mx-auto">
            <HeaderArticle
              title={t("title")}
              subtitle={t("subtitle")}
              description={t("description")}
            />
            <Certification slug={params.slug} />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export async function generateMetadata({
  params: { locale },
}: Omit<ICvPageProps, "children">): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "certification" });

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    metadataBase: new URL("https://www.jesushg.com"),
  };
}

export const generateStaticParams = () => {
  return stackTypes.map((type) => ({
    slug: type.toLowerCase(),
  }));
};

export default CvPage;
