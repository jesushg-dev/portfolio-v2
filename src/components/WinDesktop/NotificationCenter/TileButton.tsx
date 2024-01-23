import React from "react";
import type { FC } from "react";

interface ITileButtonProps {
  label: string;
  children: JSX.Element;
}

const TileButton: FC<ITileButtonProps> = ({ label, children }) => {
  return (
    <button
      type="button"
      className="rounded bg-white p-2 text-left hover:bg-opacity-50 focus:outline-none active:bg-opacity-100 dark:bg-black dark:bg-opacity-30 dark:hover:bg-opacity-50 dark:active:bg-opacity-30"
    >
      {children}
      <span>{label}</span>
    </button>
  );
};

export default TileButton;
