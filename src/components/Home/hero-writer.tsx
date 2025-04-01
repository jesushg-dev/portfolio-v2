"use client";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import TypeWriter from "@/components/shared/TypeWriter";

const titles = [
  "degree",
  "web",
  "mobile",
  "fullstack",
  "frontend",
  "backend",
] as const;

const HeroWriter: FC = () => {
  const t = useTranslations("main.heroMain");
  const strings = useMemo(
    () => titles.map((title) => t(`titles.${title}`)),
    [t],
  );

  return (
    <TypeWriter
      delay={1}
      texts={strings}
      wrapperClassName="text-2xl"
      cursorClassName="text-2xl text-primary-500"
    />
  );
};
export default HeroWriter;
