import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { FaDownload, FaHome } from "react-icons/fa";

import { Link } from "@/i18n/routing";
import CvPreview from "@/components/curriculum-vitae/cv-preview";
import { getLocalizedText } from "@/lib/i18n/localized";
import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";
import type { Locale as AppLocale } from "@/i18n/config";

interface CvPageViewProps {
  locale: string;
}

const CvPageView: FC<CvPageViewProps> = async ({ locale }) => {
  const t = await getTranslations("curriculum");

  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const userId = tenant.userId;
  const [
    profile,
    header,
    aboutMe,
    contacts,
    educations,
    languages,
    technicalSkills,
    experiences,
    softSkills,
    additionalInformation,
  ] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.cvHeader.findUnique({ where: { userId } }),
    db.cvAboutMe.findUnique({ where: { userId } }),
    db.cvContact.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvEducation.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvLanguage.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvTechnicalSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvExperience.findMany({
      where: { userId },
      include: {
        responsibilities: { orderBy: { order: "asc" } },
        CvExperienceSkill: { include: { skill: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.cvSoftSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvAdditionalInfo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!tenant.isPrimary && profile && !profile.isPublished) {
    notFound();
  }

  const currentLocale = locale as AppLocale;
  const defaultLocale = tenant.defaultLocale;

  const aboutMeText = getLocalizedText(
    aboutMe?.aboutMe,
    currentLocale,
    defaultLocale,
  );
  const cvDownloadHref = profile?.cvPdfUrl ?? null;

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

          {cvDownloadHref ? (
            <a
              href={cvDownloadHref}
              download={`CV - ${header?.fullName ?? profile?.username ?? "user"}.pdf`}
              className="pressable bg-primary-700 text-secondaryText-100 hover:bg-primary-800 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg"
            >
              {t("actions.download")} <FaDownload className="text-xs" />
            </a>
          ) : null}
        </div>
      </div>
      <section className="page md:max-w-letter print:max-w-letter print:max-h-letter print:my-o my-6 mb-0 bg-gray-100 sm:mb-6 print:mx-0 print:overflow-hidden print:border-0 print:bg-white">
        <div id="cv-public-preview" className="bg-white text-black">
          <CvPreview
            data={{
              header,
              profile,
              contacts,
              educations,
              languages,
              technicalSkills,
              experiences,
              softSkills,
              additionalInformation,
            }}
            aboutMeText={aboutMeText}
            currentLocale={currentLocale}
            defaultLocale={defaultLocale}
          />
          <div className="bg-cv p-4">
            <p className="text-xs font-semibold text-white">{t("codedWith")}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CvPageView;
