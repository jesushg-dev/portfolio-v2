import type { FC } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface IPersonalReferencesProps extends CvLocaleProps {
  personalReferences: CvData["personalReferences"];
}

const PersonalReferences: FC<IPersonalReferencesProps> = ({
  personalReferences,
  locale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  if (!personalReferences.length) return null;

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.personalReferences")}
      </h5>

      <div className="mb-2">
        {personalReferences.map((item) => (
          <div className="flex text-xs" key={item.id}>
            <p className="mr-1">-</p>
            <p className="m-0">
              {item.name}
              {item.role
                ? ` - ${getLocalizedText(item.role, locale, defaultLocale)}`
                : ""}
              {item.contact ? ` - ${item.contact}` : ""}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default PersonalReferences;
