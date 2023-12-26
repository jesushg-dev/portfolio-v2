import React, { FC } from 'react';
import TaskbarIcon, { ITaskbarIcon } from './TaskbarIcon';

interface ITaskBarProps {}

const icons: ITaskbarIcon[] = [
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-about-me-96_x6fa0e.webp',
    label: 'About Me',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-mail-96_upmhx3.webp',
    label: 'Mail',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-portfolio-96_opfju0.webp',
    label: 'Portfolio',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-resume-96-alt_wcl4bp.webp',
    label: 'Resume',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-rss-96_wxhdyp.webp',
    label: 'Blog',
  },
];

const TaskBar: FC<ITaskBarProps> = ({}) => {
  return (
    <div className="flex flex-row w-screen backdrop-blur-xl bg-black-dark-transparent justify-between py-1 z-50 select-none">
      <div
        id="weatherpress"
        className="flex flex-row items-center hover:bg-white-transparent ml-3 rounded py-0.5 select-none duration-500 px-2">
        <img className="h-6 w-6" src="./assets/Apps/widget.png" alt="" />
      </div>
      <div id="taskbar-icons" className="flex flex-row items-center space-x-2 ml-36">
        <div id="windows-icon" className="hover:bg-white-transparent duration-500 p-1.5 rounded hover:visible">
          <img
            src="./assets/Apps/windows11.png"
            alt="Windows Icon"
            className="scale-90 h-7 w-7 hover:scale-75 duration-500"
          />
        </div>
        {icons.map((icon, index) => (
          <TaskbarIcon key={String(index)} icon={icon.icon} label={icon.label} />
        ))}
      </div>
      <div className="flex flex-row items-center text-white mr-2 select-none">
        <div id="appshow" className="py-2.5 hover:bg-white-transparent duration-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div id="keyeng" className="flex flex-col rounded px-3 py-0.5 hover:bg-white-transparent duration-500">
          <p className="text-[0.75rem]">ENG</p>
          <p className="text-[0.75rem]">INTL</p>
        </div>
        <div id="wvb" className="flex flex-row hover:bg-white-transparent rounded py-3 duration-500">
          <img src="./assets/Icons/wifi.png" alt="" className="h-4 px-1.5" />
          <img src="./assets/Icons/vloume.png" alt="" className="h-4 px-1.5" />
          <img src="./assets/Icons/full-battery.png" alt="" className="h-4 px-1.5" />
        </div>
        <div
          id="notific"
          className="flex flex-col text-right pl-2 pr-2 py-0.5 hover:bg-white-transparent rounded duration-500">
          <p id="time" className="text-[0.75rem]">
            3:49 PM
          </p>
          <p id="date" className="text-[0.75rem]">
            24 Dec 2023
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskBar;
