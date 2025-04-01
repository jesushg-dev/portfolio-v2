import React from "react";
import type { FC, ReactNode } from "react";
import { useTranslations } from "next-intl";

const AdditionalInformation: FC = () => {
  const t = useTranslations("curriculum");

  const renderItems = (chunks: ReactNode) => <li className="">{chunks}.</li>;

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.additionalInformation")}
      </h5>
      <div className="mb-4">
        <ul className="list-disc pl-8 text-xs">
          {t.rich("additionalInformation", {
            item: renderItems,
          })}
        </ul>
      </div>
    </>
  );
};

export default AdditionalInformation;
