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
      ? `${education.startYear ?? ""} – ${education.endYear ?? ""}`
      : "");
  const location = education.location
    ? education.location.split("|")[0]?.trim()
    : "";

  return (
    <div className="text-muted-foreground mb-3.5 text-xs leading-relaxed">
      <b className="text-foreground block text-xs font-semibold sm:text-sm">
        {education.degreeName}
      </b>
      <span>
        {education.institution}
        {location ? ` · ${location}` : ""}
      </span>
      {dates ? (
        <div className="text-muted-foreground tabular-nums">{dates}</div>
      ) : null}
    </div>
  );
}

const Education: FC<IEducationProps> = ({ educations }) => {
  const t = useTranslations("curriculum");

  if (!educations.length) return null;

  return (
    <section>
      <h2 className="text-primary before:bg-primary mb-3.5 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase before:h-3.5 before:w-1 before:rounded-xs before:content-['']">
        {t("header.education")}
      </h2>

      <div className="space-y-1">
        {educations.map((education) => (
          <EducationItem key={education.id} education={education} />
        ))}
      </div>
    </section>
  );
};

export default Education;
