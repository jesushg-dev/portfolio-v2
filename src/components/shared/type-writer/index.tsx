"use client";

import type { FC } from "react";

import RedoAnimText from "./redo-anim-text";
import CursorBlinker from "./cursor-blinker";

// types

export interface IAnimTextProps {
  delay: number;
  texts: string[];
  wrapperClassName?: string;
  textClassName?: string;
  cursorClassName?: string;
}

const TypeWriter: FC<IAnimTextProps> = ({
  delay,
  texts,
  wrapperClassName = "",
  textClassName = "",
  cursorClassName = "",
}) => {
  return (
    <span className={wrapperClassName}>
      <RedoAnimText
        delay={delay + 1}
        texts={texts}
        textClassName={textClassName}
      />
      <CursorBlinker cursorClassName={cursorClassName} />
    </span>
  );
};

export default TypeWriter;
