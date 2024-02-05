import React from "react";
import type { FC } from "react";

import Watch from "../Watch";
import NotificationCenter from "../NotificationCenter";
import StartMenu from "../StartMenu";

import TaskBarIcons, { TaskbarIcon, TaskbarSvgIcon } from "./TaskBarIcons";
import LanguageDisplay from "./LanguageDisplay";

interface ITaskBarProps {}

const TaskBar: FC<ITaskBarProps> = ({}) => {
  return (
    <div className="bg-black-dark-transparent grid w-screen grid-cols-3 items-center py-2 backdrop-blur-xl">
      <div className="ml-2">
        <TaskbarIcon
          isActive={false}
          icon="https://res.cloudinary.com/js-media/image/upload/v1703735860/portfolio/win11/icons/gjsbula9edftwkm5grtr.webp"
          title="Weather Icon"
        />
      </div>
      <div id="taskbar-icons" className="flex w-full justify-center gap-2">
        <StartMenu />
        <TaskBarIcons />
      </div>
      <div className="flex w-full justify-end gap-2">
        <div id="appshow">
          <TaskbarSvgIcon isActive={false} title="App Show">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 scale-90 duration-500 hover:scale-75"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </TaskbarSvgIcon>
        </div>
        <LanguageDisplay />
        <TaskbarIcon
          size={16}
          isActive={false}
          icon="https://res.cloudinary.com/js-media/image/upload/v1703736560/portfolio/win11/icons/izonkigx8htqcaib4ygy.webp"
          title="Network Connection"
        />
        <TaskbarIcon
          size={16}
          isActive={false}
          icon="https://res.cloudinary.com/js-media/image/upload/v1703736560/portfolio/win11/icons/wssk3k3ks9vyewzua4oi.webp"
          title="Audio Configuration"
        />
        <TaskbarIcon
          size={16}
          isActive={false}
          icon="https://res.cloudinary.com/js-media/image/upload/v1703736560/portfolio/win11/icons/sruoyqiy6vhvhighdros.webp"
          title="Battery Information"
        />
        <Watch />
        <NotificationCenter />
        <TaskbarSvgIcon isActive={false} title="Show Desktop">
          <div />
        </TaskbarSvgIcon>
      </div>
    </div>
  );
};

export default TaskBar;
