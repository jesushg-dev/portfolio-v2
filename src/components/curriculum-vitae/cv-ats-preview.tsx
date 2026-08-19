import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface CvAtsPreviewProps {
  data: LocalizedCvData;
  aboutMeText: string | null;
  pdfMode?: boolean;
}

function formatExperienceDateRange(
  startDate: Date | null,
  endDate: Date | null,
  current: boolean,
  presentLabel: string,
): string {
  const fmt = (d: Date) => {
    const month = d.toLocaleString("en-US", { month: "long" });
    return `${month} ${d.getFullYear()}`;
  };

  if (!startDate && !endDate) return "";
  const start = startDate ? fmt(startDate) : "";
  const end = current ? presentLabel : endDate ? fmt(endDate) : "";
  return [start, end].filter(Boolean).join(" – ");
}

function AtsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="border-b border-blue-800 pb-1 text-sm font-bold tracking-wide text-blue-800 uppercase">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const SKILL_CATEGORY_LABELS: Record<string, string> = {
  FRONTEND: "Front-end",
  BACKEND: "Back-end",
  DATABASE: "Databases",
  TOOLS: "Tools",
  MOBILE: "Mobile",
  DESKTOP: "Desktop",
  DEVOPS: "DevOps",
  CYBERSECURITY: "Cybersecurity",
  OTHER: "Other",
};

const CvAtsPreview: FC<CvAtsPreviewProps> = ({ data, aboutMeText }) => {
  const t = useTranslations("curriculum");

  const fullName =
    data.header?.fullName ?? data.profile?.displayName ?? "Unknown";
  const degree = data.header?.degree ?? "";

  const contactLine = data.contacts.map((c) => c.value).join("   |   ");

  return (
    <div className="mx-auto max-w-3xl bg-white px-10 py-8 font-serif text-neutral-900">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
        {degree ? (
          <p className="mt-1 text-base text-neutral-700 italic">{degree}</p>
        ) : null}
        {contactLine ? (
          <p className="mt-2 text-xs text-neutral-700">{contactLine}</p>
        ) : null}
      </header>

      {aboutMeText ? (
        <AtsSection title={t("header.aboutMe")}>
          <p className="text-xs leading-relaxed">{aboutMeText}</p>
        </AtsSection>
      ) : null}

      {data.experiences.length > 0 ? (
        <AtsSection title={t("header.experience")}>
          <div className="space-y-4">
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xs font-bold tracking-tight text-blue-800 uppercase">
                    {exp.company}
                  </h3>
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {formatExperienceDateRange(
                      exp.startDate,
                      exp.endDate,
                      exp.current,
                      t("ats.present"),
                    )}
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-xs font-semibold italic">
                    {exp.role}
                    {exp.location ? ` — ${exp.location}` : ""}
                  </p>
                  {exp.responsibilities.length > 0 ? (
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {exp.responsibilities.map((r) => (
                        <li key={r.id} className="text-xs leading-relaxed">
                          {r.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {exp.skills.length > 0 ? (
                    <p className="mt-1 text-xs">
                      <span className="font-bold">Stack: </span>
                      {exp.skills.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </AtsSection>
      ) : null}

      {data.technicalSkills.length > 0 ? (
        <AtsSection title={t("header.technicalSkills")}>
          <div className="space-y-1">
            {data.technicalSkills.map((group) => (
              <p key={group.id} className="text-xs">
                <span className="font-bold">
                  {SKILL_CATEGORY_LABELS[group.category] ?? group.category}
                  :{" "}
                </span>
                {group.items.join(", ")}
              </p>
            ))}
          </div>
        </AtsSection>
      ) : null}

      {data.educations.length > 0 ? (
        <AtsSection title={t("header.education")}>
          <div className="space-y-1">
            {data.educations.map((edu) => {
              const years =
                edu.dates ??
                [edu.startYear, edu.endYear].filter(Boolean).join(" – ");
              return (
                <div
                  key={edu.id}
                  className="flex items-baseline justify-between gap-4 text-xs"
                >
                  <span>
                    <span className="font-bold">{edu.degreeName}</span>
                    {edu.institution ? ` — ${edu.institution}` : ""}
                    {edu.location ? `, ${edu.location}` : ""}
                  </span>
                  {years ? (
                    <span className="font-semibold whitespace-nowrap">
                      {years}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </AtsSection>
      ) : null}

      {data.languages.length > 0 ? (
        <AtsSection title={t("header.languages")}>
          <p className="text-xs">
            {data.languages.map((lang, i) => (
              <span key={lang.id}>
                <span className="font-bold">{lang.name}:</span> {lang.level}
                {i < data.languages.length - 1 ? "     " : null}
              </span>
            ))}
          </p>
        </AtsSection>
      ) : null}

      {data.softSkills.length > 0 ? (
        <AtsSection title={t("header.personalSkills")}>
          <p className="text-xs">
            {data.softSkills.map((s) => s.name).join(" • ")}
          </p>
        </AtsSection>
      ) : null}

      {data.additionalInformation.length > 0 ? (
        <AtsSection title={t("header.additionalInformation")}>
          <ul className="list-disc space-y-1 pl-5">
            {data.additionalInformation.map((info) => (
              <li key={info.id} className="text-xs leading-relaxed">
                {info.text}
              </li>
            ))}
          </ul>
        </AtsSection>
      ) : null}

      {data.personalReferences.length > 0 ? (
        <AtsSection title={t("header.personalReferences")}>
          <div className="space-y-1">
            {data.personalReferences.map((ref) => (
              <p key={ref.id} className="text-xs">
                <span className="font-bold">{ref.name}</span>
                {ref.role ? ` — ${ref.role}` : ""}
                {ref.contact ? ` — ${ref.contact}` : ""}
              </p>
            ))}
          </div>
        </AtsSection>
      ) : null}
    </div>
  );
};

export default CvAtsPreview;
