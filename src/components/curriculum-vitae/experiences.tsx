import type { FC } from "react";
import { useTranslations, useLocale } from "next-intl";

import { formatExperienceDates } from "@/utils/tools/date";
import type { LocalizedCvData } from "./types";

interface IExperiencesProps {
  experiences: LocalizedCvData["experiences"];
}

function ResponsibilityItem({
  responsibility,
}: {
  responsibility: LocalizedCvData["experiences"][number]["responsibilities"][number];
}) {
  return <li>{responsibility.text}</li>;
}

function ExperienceItem({
  experience,
}: {
  experience: LocalizedCvData["experiences"][number];
}) {
  const locale = useLocale();
  const dates = formatExperienceDates(
    experience.startDate,
    experience.endDate,
    experience.current,
    locale,
  );

  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold">{experience.role}</h3>
      <h4 className="my-1 text-sm text-[#333333]">
        {experience.company}
        {dates ? ` · ${dates}` : ""}
      </h4>
      {experience.responsibilities.length > 0 ? (
        <ul className="list-disc pl-8 text-sm text-[#1a1a1a]">
          {experience.responsibilities.map((responsibility) => (
            <ResponsibilityItem
              key={responsibility.id}
              responsibility={responsibility}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const Experiences: FC<IExperiencesProps> = ({ experiences }) => {
  const t = useTranslations("curriculum");

  if (!experiences.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.experience")}
      </h5>

      {experiences.map((experience) => (
        <ExperienceItem key={experience.id} experience={experience} />
      ))}
    </>
  );
};

export default Experiences;
