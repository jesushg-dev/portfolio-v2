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
    <li className="rounded-md border border-[#0a3d7a]/20 bg-white px-2 py-0.5 text-sm leading-[1.35] text-slate-800">
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
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
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
