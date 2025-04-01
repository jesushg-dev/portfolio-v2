import React from "react";
import type { FC } from "react";

interface ITileButtonProps {
  label: string;
  children: React.JSX.Element;
}

const TileButton: FC<ITileButtonProps> = ({ label, children }) => {
  return (
    <button
      type="button"
      className="rounded-sm bg-white p-2 text-left hover:bg-white/50 focus:outline-none active:bg-white/100 dark:bg-black/30 dark:hover:bg-black/50 dark:active:bg-black/30"
    >
      {children}
      <span>{label}</span>
    </button>
  );
};

export default TileButton;
