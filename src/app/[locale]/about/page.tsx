import React from "react";
import type { FC } from "react";
import { unstable_setRequestLocale as UnstableSetRequestLocale } from "next-intl/server";

import PageLayout from "@/components/Layout";

// types

interface IAboutPageProps {
  params: { locale: string };
}

const AboutPage: FC<IAboutPageProps> = ({ params: { locale } }) => {
  // Enable static rendering
  UnstableSetRequestLocale(locale);

  return (
    <PageLayout>
      <div className="max-w-[460px]" />
    </PageLayout>
  );
};

export default AboutPage;
