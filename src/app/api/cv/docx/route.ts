import { NextResponse } from "next/server";

import { locales, type Locale } from "@/i18n/config";
import { resolveTenant } from "@/lib/tenant/resolve";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { db } from "@/server/db";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { resolveCvAboutPreviewText } from "@/features/cv/lib/resolve-cv-about-preview-text";
import { mapCvDataToLocalized } from "@/components/curriculum-vitae/types";
import { resolveCvDisplayContacts } from "@/lib/cv/resolve-cv-display-contacts";
import { mapLocalizedCvToDraft } from "@/features/cv/lib/map-localized-to-draft";
import { generateDocxFromStructured } from "@/features/resume-engine/lib/docx/generate-from-structured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLocale(value: string | null): value is Locale {
  return value !== null && (locales as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const tenant = await resolveTenant();
  if (!tenant || !isPublicCvVisible(tenant)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale");
  const locale: Locale = isLocale(localeParam)
    ? localeParam
    : tenant.defaultLocale;

  const userId = tenant.userId;

  try {
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
    ] = await Promise.all([
      db.appLanguage.findMany(),
      db.profile.findUnique({ where: { userId } }),
      db.cvHeader.findUnique({
        where: { userId },
        include: { translations: true },
      }),
      db.cvAboutMe.findUnique({
        where: { userId },
        include: { translations: true },
      }),
      db.cvContact.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.cvEducation.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.cvLanguage.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.cvTechnicalSkill.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
      db.cvExperience.findMany({
        where: { userId },
        include: {
          translations: true,
          responsibilities: {
            include: { translations: true },
            orderBy: { order: "asc" },
          },
          CvExperienceSkill: { include: { skill: true } },
        },
        orderBy: { order: "asc" },
      }),
      db.cvSoftSkill.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.cvAdditionalInfo.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
      db.cvPersonalReference.findMany({
        where: { userId },
        include: { translations: true },
        orderBy: { order: "asc" },
      }),
    ]);

    if (!header) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const displayContacts = resolveCvDisplayContacts(contacts, profile);
    const appLanguageRefs = appLanguages.map(({ id, code }) => ({ id, code }));
    const field = createLocalizedFieldResolver(appLanguages, locale);

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
      locale,
    );

    const aboutMeText = resolveCvAboutPreviewText(
      field(header.translations, "heroSummary"),
      aboutMe ? field(aboutMe.translations, "aboutMe") : null,
    );

    const draft = mapLocalizedCvToDraft(localizedData, aboutMeText, locale);
    const buffer = await generateDocxFromStructured(draft);

    const fileName = `CV-${header.fullName.replace(/[^\w.-]+/g, "_")}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[cv/docx] generation failed", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 },
    );
  }
}
