import React from "react";
import Image from "next/image";

export interface IDesktopIcon {
  id: string | number;
  icon: string;
  title: string;
  onClick?: () => void;
}

const DesktopIcon: React.FC<IDesktopIcon> = ({ id, icon, title, onClick }) => {
  return (
    <button
      data-id={id}
      type="button"
      onClick={onClick}
      className="pressable supports-backdrop-blur:bg-white/95 flex w-full select-none flex-col items-center rounded p-2 text-xs text-white duration-500 hover:bg-slate-900/75 hover:backdrop-blur hover:transition-colors"
    >
      <Image src={icon} alt={title} height={40} width={40} className="mb-2" />
      <span>{title}</span>
    </button>
  );
};

export default DesktopIcon;
