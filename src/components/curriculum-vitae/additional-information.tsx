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
  return <li>{entry.text}.</li>;
}

const AdditionalInformation: FC<IAdditionalInformationProps> = ({
  additionalInformation,
}) => {
  const t = useTranslations("curriculum");

  if (!additionalInformation.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.additionalInformation")}
      </h5>
      <div className="mb-4">
        <ul className="list-disc pl-8 text-sm text-[#1a1a1a]">
          {additionalInformation.map((entry) => (
            <AdditionalItem key={entry.id} entry={entry} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default AdditionalInformation;
