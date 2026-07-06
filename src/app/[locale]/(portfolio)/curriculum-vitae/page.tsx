import type { FC } from "react";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { FaDownload, FaHome } from "react-icons/fa";

import { Link } from "@/i18n/routing";
import CvPreview from "@/components/curriculum-vitae/cv-preview";
import { getLocalizedText } from "@/lib/i18n/localized";
import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";
import type { Locale as AppLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

interface ICvPageProps {
  params: Promise<{ locale: string }>;
}

const CvPage: FC<ICvPageProps> = async ({ params }) => {
  const { locale } = await params;
  // Enable static rendering
  setRequestLocale(locale as Locale);

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
      include: { responsibilities: { orderBy: { order: "asc" } } },
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

  // For non-primary tenants we honor the `isPublished` flag.
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
      <section className="page print:max-w-letter print:max-h-letter print:my-o lg:h-letter md:max-w-letter md:h-letter my-6 mb-0 overflow-hidden bg-gray-100 sm:mb-6 print:mx-0 print:border-0 print:bg-white">
        <div style={{ opacity: 1 }} className="bg-white text-black">
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

export async function generateMetadata({
  params,
}: Omit<ICvPageProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "curriculum",
  });

  const tenant = await resolveTenant();
  let title = t("title");
  let description = "";
  if (tenant) {
    const [header, aboutMe] = await Promise.all([
      db.cvHeader.findUnique({ where: { userId: tenant.userId } }),
      db.cvAboutMe.findUnique({ where: { userId: tenant.userId } }),
    ]);
    if (header?.fullName) {
      title = `${header.fullName} - Curriculum Vitae`;
    }
    description = getLocalizedText(
      aboutMe?.aboutMe,
      locale as AppLocale,
      tenant.defaultLocale,
    );
  }

  return {
    title,
    description,
    manifest: "/manifest.json",
    metadataBase: new URL("https://www.jesushg.com"),
  };
}

export default CvPage;
