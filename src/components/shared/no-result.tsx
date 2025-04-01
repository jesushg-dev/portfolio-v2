import React from "react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import NoSvgAlt from "./no-svg-alt";

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
      <div className="relative flex h-full w-full grow flex-col items-center justify-center">
        <h1 className="text-primaryText-800 my-2 text-4xl font-bold">
          {title ?? t("title")}
        </h1>
        <p className="text-primaryText-800 my-2">
          {description ?? t("description")}
        </p>
        {children}
      </div>
      <NoSvgAlt />
    </div>
  );
};

export default NoResult;
