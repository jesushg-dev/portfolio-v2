import React from "react";
import type { FC } from "react";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaDownload, FaHome } from "react-icons/fa";

import { Link } from "@/i18n/routing";
import AdditionalInformation from "@/components/CurriculumVitae/AdditionalInformation";
import ContactMe from "@/components/CurriculumVitae/ContactMe";
import Education from "@/components/CurriculumVitae/Education";
import Experience from "@/components/CurriculumVitae/Experiences";
import HeaderCv from "@/components/CurriculumVitae/HeaderCv";
import Languages from "@/components/CurriculumVitae/Languages";
import TechnicalSkills from "@/components/CurriculumVitae/TechnicalSkills";
import { CvContextProvider } from "@/hoc/cv-context-provider";
import SoftSkills from "@/components/CurriculumVitae/SoftSkills";

interface ICvPageProps {
  params: Promise<{ locale: Locale }>;
}

const CvPage: FC<ICvPageProps> = async ({ params }) => {
  const { locale } = await params;
  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations("curriculum");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="-mt-2 pt-24 print:hidden">
        <div className="md:max-w-letter mx-4 flex justify-between gap-2 md:mx-0">
          <Link
            href="/"
            className="pressable border-primary-700 text-primary-700 hover:bg-primary-800 hover:text-secondaryText-100 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg"
          >
            {t("actions.goBack")} <FaHome className="text-xs" />
          </Link>

          <a
            href={t("downloadLink")}
            download="CV - Jesús Enmanuel Hernández González.pdf"
            className="pressable bg-primary-700 text-secondaryText-100 hover:bg-primary-800 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg"
          >
            {t("actions.download")} <FaDownload className="text-xs" />
          </a>
        </div>
      </div>
      <section className="page print:max-w-letter print:max-h-letter print:my-o lg:h-letter md:max-w-letter md:h-letter my-6 mb-0 overflow-hidden bg-gray-100 sm:mb-6 print:mx-0 print:border-0 print:bg-white">
        <div style={{ opacity: 1 }} className="bg-white text-black">
          <CvContextProvider>
            <HeaderCv />
            <div className="grid grid-cols-1 p-5 pb-10 sm:grid-cols-9">
              <div className="sm:col-span-3">
                <ContactMe />
                <Education />
                <Languages />
                <TechnicalSkills />
              </div>
              <div className="col-span-1 hidden w-full justify-center sm:flex">
                <div className="h-full w-[1px] border-r" />
              </div>
              <div className="sm:col-span-5">
                <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
                  {t("header.aboutMe")}
                </h5>

                <div className="mb-4">
                  <h3 className="text-xs">{t("aboutMe")}</h3>
                </div>

                <Experience />
                <SoftSkills />
                <AdditionalInformation />
              </div>
            </div>
          </CvContextProvider>
          <div className="bg-cv p-4">
            <p className="text-xs font-semibold text-white">{t("codedWith")}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export async function generateMetadata({
  params,
}: Omit<ICvPageProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "curriculum" });

  return {
    title: t("title"),
    description: t("aboutMe"),
    manifest: "/manifest.json",
    metadataBase: new URL("https://www.jesushg.com"),
  };
}

export default CvPage;
