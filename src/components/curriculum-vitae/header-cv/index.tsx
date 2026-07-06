import type { FC } from "react";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "../types";
import ClientImage from "./client-image";

interface IHeaderCvProps extends CvLocaleProps {
  header: CvData["header"];
  fallbackName?: string | null;
}

const HeaderCV: FC<IHeaderCvProps> = ({
  header,
  fallbackName,
  locale,
  defaultLocale,
}) => {
  const fullName = header?.fullName ?? fallbackName ?? "";
  const degree = getLocalizedText(header?.degree, locale, defaultLocale);
  const alt = getLocalizedText(header?.clientImageAlt, locale, defaultLocale);

  return (
    <div className="bg-cv flex flex-row items-center justify-between border-b-2 px-8 py-4 text-white">
      <div className="flex flex-col items-start">
        <h1 className="mb-2 text-4xl font-normal">{degree}</h1>
        <h2 className="text-xl font-normal">{fullName}</h2>
      </div>
      {header?.photoUrl ? (
        <div>
          <ClientImage src={header.photoUrl} alt={alt || fullName} />
        </div>
      ) : null}
    </div>
  );
};

export default HeaderCV;
