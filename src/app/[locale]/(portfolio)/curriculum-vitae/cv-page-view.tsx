import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CvPreview from "@/components/curriculum-vitae/cv-preview";
import CvPageActions from "@/features/cv/components/cv-page-actions";
import { cvPreviewFont } from "@/features/cv/lib/cv-preview-font";
import { getLocalizedText } from "@/lib/i18n/localized";
import { canDeliverPortfolioCvEmail } from "@/lib/email/resend";
import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";
import type { Locale as AppLocale } from "@/i18n/config";

interface CvPageViewProps {
  locale: string;
  pdfMode?: boolean;
  /** When true, PDF export uses US Letter pagination instead of one continuous page. */
  paginatePdfPages?: boolean;
}

const CvPageView: FC<CvPageViewProps> = async ({
  locale,
  pdfMode = false,
  paginatePdfPages = false,
}) => {
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
  const downloadFileName = `CV - ${header?.fullName ?? profile?.username ?? "user"}.pdf`;
  const paginateQuery = paginatePdfPages ? "&paginate=1" : "";
  const cvDownloadHref = header
    ? `/api/cv/pdf?locale=${currentLocale}${paginateQuery}`
    : null;
  const canSendByEmail =
    Boolean(header) &&
    (await canDeliverPortfolioCvEmail(userId, currentLocale));

  if (pdfMode) {
    return (
      <div
        id="cv-public-preview"
        className={`${cvPreviewFont.variable} ${cvPreviewFont.className} cv-docx-font bg-white text-black`}
      >
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
          pdfMode
        />
        <div className="bg-cv h-4" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-16 md:pb-24">
      <div className="-mt-2 pt-24 print:hidden">
        <CvPageActions
          fullName={header?.fullName ?? profile?.username ?? "user"}
          canSendByEmail={canSendByEmail}
          downloadHref={cvDownloadHref}
          downloadFileName={downloadFileName}
          goBackLabel={t("actions.goBack")}
          downloadLabel={t("actions.download")}
          paginatePdfPages={paginatePdfPages}
        />
      </div>
      <section className="page md:max-w-letter print:max-w-letter print:max-h-letter print:my-o my-6 mb-0 bg-gray-100 sm:mb-6 print:mx-0 print:overflow-hidden print:border-0 print:bg-white">
        <div
          id="cv-public-preview"
          className={`${cvPreviewFont.variable} ${cvPreviewFont.className} cv-docx-font bg-white text-black`}
        >
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
