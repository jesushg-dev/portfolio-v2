"use client";
import type { FC } from "react";
import TypeWriter from "@/components/shared/type-writer";

interface HeroWriterProps {
  titles: string[];
}

const HeroWriter: FC<HeroWriterProps> = ({ titles }) => {
  if (titles.length === 0) return null;

  return (
    <TypeWriter
      delay={1}
      texts={titles}
      wrapperClassName="text-2xl"
      cursorClassName="text-2xl text-primary-500"
    />
  );
};

export default HeroWriter;
