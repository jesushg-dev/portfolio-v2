import React from "react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import NoSvgAlt from "./NoSvgAlt";

// types

interface INoResultProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const NoResult: FC<INoResultProps> = ({ title, description, children }) => {
  const t = useTranslations("global.fallback.noResults");

  return (
    <div className="grid grid-cols-1 items-center justify-center lg:grid-cols-2">
      <div className="relative flex h-full w-full flex-grow flex-col items-center justify-center">
        <h1 className="my-2 text-4xl font-bold text-primaryText-800">
          {title || t("title")}
        </h1>
        <p className="my-2 text-primaryText-800">
          {description || t("description")}
        </p>
        {children}
      </div>
      <NoSvgAlt />
    </div>
  );
};

export default NoResult;
