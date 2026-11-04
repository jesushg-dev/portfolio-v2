import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface IAdditionalInformationProps {
  additionalInformation: LocalizedCvData["additionalInformation"];
}

function AdditionalItem({
  entry,
}: {
  entry: LocalizedCvData["additionalInformation"][number];
}) {
  return (
    <li className="border-primary/20 bg-card text-foreground/90 rounded-md border px-2 py-0.5 text-sm leading-[1.35]">
      {entry.text}
    </li>
  );
}

const AdditionalInformation: FC<IAdditionalInformationProps> = ({
  additionalInformation,
}) => {
  const t = useTranslations("curriculum");

  if (!additionalInformation.length) return null;

  return (
    <section>
      <h2 className="text-primary before:bg-primary mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] uppercase before:h-4 before:w-1 before:rounded-full before:content-['']">
        {t("header.additionalInformation")}
      </h2>

      <ul className="flex flex-wrap gap-1.5">
        {additionalInformation.map((entry) => (
          <AdditionalItem key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
};

export default AdditionalInformation;
