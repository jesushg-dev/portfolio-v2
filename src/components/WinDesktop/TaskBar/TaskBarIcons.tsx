"use client";

import React, { useCallback } from "react";
import Image from "next/image";

import { useWindowContext } from "@/hoc/window-context-provider";

import icons from "../icons";

export interface ITaskbarIcon {
  icon: string;
  title: string;
  onClick?: (active: boolean) => void;
  isActive: boolean;
  size?: number;
}

const TaskbarIcon: React.FC<ITaskbarIcon> = ({
  icon,
  title,
  onClick,
  isActive,
  size = 32,
}) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick?.bind(null, isActive)}
      className={`relative cursor-auto rounded p-1.5 duration-200 hover:bg-black ${isActive ? "bg-[rgba(255,255,255,0.2)]" : "hover:bg-[rgba(255,255,255,0.2)]"}`}
    >
      <Image
        width={size}
        height={size}
        alt={title}
        src={icon}
        className="h-7 w-7 scale-90 duration-500 hover:scale-75"
      />
      {isActive && (
        <div className="bg-primary-500 absolute right-3 bottom-0.5 left-3 h-[0.2rem] rounded-xs" />
      )}
    </button>
  );
};

export interface ITaskbarSvgIcon extends Omit<ITaskbarIcon, "icon"> {
  children: React.ReactNode;
}

const TaskbarSvgIcon: React.FC<ITaskbarSvgIcon> = ({
  children,
  title,
  onClick,
  isActive,
}) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick?.bind(null, isActive)}
      className={`relative cursor-auto rounded p-1.5 duration-200 hover:bg-[rgba(255,255,255,0.2)] hover:bg-black ${isActive ? "bg-[rgba(255,255,255,0.2)] bg-black" : ""}`}
    >
      {children}
      {isActive && (
        <div className="bg-primary-500 absolute right-3 bottom-0.5 left-3 h-[0.2rem] rounded-xs" />
      )}
    </button>
  );
};
const TaskBarIcons: React.FC = () => {
  const { handleWindow, windows } = useWindowContext();

  //  check if window is open
  const isWindowOpen = useCallback(
    (id: string) => windows.some((window) => window.id === id),
    [windows],
  );

  return (
    <>
      {icons.map((icon) => (
        <TaskbarIcon
          key={icon.id}
          icon={icon.icon}
          title={icon.title}
          isActive={isWindowOpen(icon.id)}
          onClick={() => handleWindow(icon)}
        />
      ))}
    </>
  );
};

export { TaskbarIcon, TaskbarSvgIcon };
export default TaskBarIcons;
