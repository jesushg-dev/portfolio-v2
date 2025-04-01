import React from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import ClientImage from "./ClientImage";

const HeaderCV: FC = () => {
  const t = useTranslations("curriculum");

  return (
    <div className="bg-cv flex flex-col items-center gap-4 border-b-2 p-5 py-7 text-white sm:flex-row">
      <ClientImage />
      <div className="flex flex-col items-center justify-center sm:items-start">
        <h1 className="text-2xl font-bold">
          {t("degree")}
          <span className="ml-0.5 hidden text-2xl font-bold opacity-[1px]">
            *
          </span>
        </h1>
        <h2 className="text-sm font-semibold">
          Jesús Enmanuel Hernández González
        </h2>
      </div>
    </div>
  );
};

export default HeaderCV;
