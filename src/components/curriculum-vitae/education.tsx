import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface IEducationProps {
  educations: LocalizedCvData["educations"];
}

function EducationItem({
  education,
}: {
  education: LocalizedCvData["educations"][number];
}) {
  const dates =
    education.dates ??
    (education.startYear || education.endYear
      ? `${education.startYear ?? ""} - ${education.endYear ?? ""}`
      : "");
  const location = education.location
    ? education.location.split("|")[0]?.trim()
    : "";

  return (
    <div>
      <h3 className="text-sm leading-snug font-bold text-slate-900">
        {education.degreeName}
      </h3>
      <p className="text-sm text-slate-700">
        {education.institution}
        {location ? ` · ${location}` : ""}
      </p>
      {dates ? (
        <p className="text-sm text-slate-600 tabular-nums">{dates}</p>
      ) : null}
    </div>
  );
}

const Education: FC<IEducationProps> = ({ educations }) => {
  const t = useTranslations("curriculum");

  if (!educations.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
        {t("header.education")}
      </h2>

      <div className="space-y-3">
        {educations.map((education) => (
          <EducationItem key={education.id} education={education} />
        ))}
      </div>
    </section>
  );
};

export default Education;
