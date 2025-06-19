import React from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import ClientImage from "./ClientImage";

const HeaderCV: FC = () => {
  const t = useTranslations("curriculum");

  return (
    <div className="bg-cv flex flex-row items-center justify-between border-b-2 px-8 py-4 text-white">
      <div className="flex flex-col items-start">
        <h1 className="mb-2 text-4xl font-normal">{t("degree")}</h1>
        <h2 className="text-xl font-normal">
          Jesús Enmanuel Hernández González
        </h2>
      </div>
      <div>
        <ClientImage alt={t("clientImageAlt")} />
      </div>
    </div>
  );
};

export default HeaderCV;
