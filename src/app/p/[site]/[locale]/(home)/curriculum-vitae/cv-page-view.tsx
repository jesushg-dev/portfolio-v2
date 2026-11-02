import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CvPreview from "@/components/curriculum-vitae/cv-preview";
import CvAtsPreview from "@/components/curriculum-vitae/cv-ats-preview";
import CvPageActions from "@/features/cv/components/cv-page-actions";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { cvPreviewFont } from "@/features/cv/lib/cv-preview-font";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { resolveCvAboutPreviewText } from "@/features/cv/lib/resolve-cv-about-preview-text";
import { canDeliverPortfolioCvEmail } from "@/lib/email/resend";
import { resolveCvDisplayContacts } from "@/lib/cv/resolve-cv-display-contacts";
import { resolveTenant } from "@/lib/tenant/resolve";
import type { Locale as AppLocale } from "@/i18n/config";
import { mapCvDataToLocalized } from "@/components/curriculum-vitae/types";
import {
  isValidCvDesign,
  DEFAULT_CV_DESIGN,
  type CvDesignId,
} from "@/features/cv/lib/cv-design";
import {
  buildAtsCvFileName,
  inferCvRoleTrack,
} from "@/lib/cv/build-ats-cv-file-name";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { getPublicCvPageData } from "@/features/cv/lib/get-public-cv-page-data";
import CvUnpublished from "./cv-unpublished";

interface CvPageViewProps {
  locale: string;
  pdfMode?: boolean;
  /** When true, PDF export uses US Letter pagination instead of one continuous page. */
  paginatePdfPages?: boolean;
  design?: string;
}

const CvPageView: FC<CvPageViewProps> = async ({
  locale,
  pdfMode = false,
  paginatePdfPages = false,
  design: designParam,
}) => {
  const design: CvDesignId = isValidCvDesign(designParam)
    ? designParam
    : DEFAULT_CV_DESIGN;
  const t = await getTranslations("curriculum");

  const tenant = await resolveTenant();
  if (!tenant) notFound();

  if (!isPublicCvVisible(tenant)) {
    if (pdfMode) notFound();
    return (
      <CvUnpublished
        title={t("unpublished.title")}
        description={t("unpublished.description")}
        backHome={t("unpublished.backHome")}
      />
    );
  }

  const userId = tenant.userId;
  const [
    appLanguages,
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
    personalReferences,
  ] = await getPublicCvPageData(userId, pdfMode);
  const displayContacts = resolveCvDisplayContacts(contacts, profile);

  const defaultLocale = tenant.defaultLocale || "en";
  const currentLocale = (locale as AppLocale) || defaultLocale;

  const appLanguageRefs = appLanguages.map(({ id, code }) => ({ id, code }));

  const field = createLocalizedFieldResolver(appLanguages, currentLocale);
  const aboutMeText = resolveCvAboutPreviewText(
    aboutMe ? field(aboutMe.translations, "aboutMe") : null,
  );
  const downloadFileName = buildAtsCvFileName({
    fullName: header?.fullName ?? profile?.username ?? "user",
    roleTrack: inferCvRoleTrack(field(header?.translations, "degree") || ""),
    locale: currentLocale,
    extension: "pdf",
  });
  const paginateQuery = paginatePdfPages ? "&paginate=1" : "";
  const designQuery = design !== DEFAULT_CV_DESIGN ? `&design=${design}` : "";
  const cvDownloadHref = header
    ? `/api/cv/pdf?locale=${currentLocale}${paginateQuery}${designQuery}`
    : null;
  const canSendByEmail =
    Boolean(header) &&
    (await canDeliverPortfolioCvEmail(userId, currentLocale));

  const localizedData = mapCvDataToLocalized(
    {
      header,
      profile,
      contacts: displayContacts,
      educations,
      languages,
      technicalSkills,
      experiences,
      softSkills,
      additionalInformation,
      personalReferences,
      aboutMe,
    },
    appLanguageRefs,
    currentLocale,
  );

  const PreviewComponent = design === "ats" ? CvAtsPreview : CvPreview;

  if (pdfMode) {
    return (
      <div
        id="cv-public-preview"
        className={`${cvPreviewFont.variable} ${cvPreviewFont.className} cv-docx-font bg-white text-slate-900`}
      >
        <PreviewComponent
          data={localizedData}
          aboutMeText={aboutMeText}
          pdfMode
          locale={currentLocale}
        />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen pt-24 pb-16 font-sans print:bg-white print:p-0">
      <div className="chrome mx-auto max-w-[51rem] px-4 pb-4 print:hidden">
        <TRPCReactProvider>
          <CvPageActions
            fullName={header?.fullName ?? profile?.username ?? "user"}
            canSendByEmail={canSendByEmail}
            downloadHref={cvDownloadHref}
            downloadFileName={downloadFileName}
            goBackLabel={t("actions.goBack")}
            downloadLabel={t("actions.download")}
            paginatePdfPages={paginatePdfPages}
          />
          <Toaster />
        </TRPCReactProvider>
      </div>
      <main
        id="sheet"
        className="sheet mx-auto w-full max-w-[51rem] overflow-hidden bg-white text-slate-900 shadow-[0_1.875rem_4.375rem_-1.875rem_rgba(10,61,122,0.45)] md:rounded-2xl print:m-0 print:w-[51rem] print:max-w-none print:rounded-none print:shadow-none"
      >
        <div
          id="cv-public-preview"
          className={`${cvPreviewFont.variable} ${cvPreviewFont.className} cv-docx-font bg-white text-slate-900`}
        >
          <PreviewComponent
            data={localizedData}
            aboutMeText={aboutMeText}
            locale={currentLocale}
          />
        </div>
      </main>
    </div>
  );
};

export default CvPageView;
