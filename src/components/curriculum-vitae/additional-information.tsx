import type { FC } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface IAdditionalInformationProps extends CvLocaleProps {
  additionalInformation: CvData["additionalInformation"];
}

const AdditionalInformation: FC<IAdditionalInformationProps> = ({
  additionalInformation,
  locale,
  defaultLocale,
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
            <li key={entry.id}>
              {getLocalizedText(entry.text, locale, defaultLocale)}.
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default AdditionalInformation;
