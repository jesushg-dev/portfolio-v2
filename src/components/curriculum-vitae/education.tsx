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

  return (
    <section className="mb-4">
      <header>
        <h5 className="text-sm font-bold">{education.degreeName}</h5>
        <h6 className="text-sm text-[#333333]">
          {education.institution}
          {education.location ? ` | ${education.location}` : ""}
        </h6>
      </header>
      {dates ? <p className="my-1 text-sm text-[#333333]">{dates}</p> : null}
    </section>
  );
}

const Education: FC<IEducationProps> = ({ educations }) => {
  const t = useTranslations("curriculum");

  if (!educations.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.education")}
      </h5>

      <div className="mb-4">
        {educations.map((education) => (
          <EducationItem key={education.id} education={education} />
        ))}
      </div>
    </>
  );
};

export default Education;
