'use client';

import React, { FC, useCallback } from 'react';

import Image from 'next/image';

import icons from '../icons';
import Watch from './Watch';
import TaskbarIcon from '../TaskbarIcon';

import { useWindowContext } from '@/hoc/WindowContext';

import type { ICreateWindowProps } from '@/hoc/WindowContext';

interface ITaskBarProps {}

const TaskBar: FC<ITaskBarProps> = ({}) => {
  const { createWindow, toggleMinimizeWindow, windows } = useWindowContext();

  const openAboutMe = (active: boolean, data: ICreateWindowProps) => {
    if (active) {
      toggleMinimizeWindow(data.id);
      return;
    }
    createWindow(data);
  };

  //check if window is open
  const isWindowOpen = useCallback((id: string) => windows.some((window) => window.id === id), [windows]);

  return (
    <div className="flex flex-row w-screen backdrop-blur-xl bg-black-dark-transparent justify-between py-1 z-50 select-none">
      <div
        id="weatherpress"
        className="flex flex-row items-center hover:bg-white-transparent ml-3 rounded py-0.5 select-none duration-500 px-2">
        <Image
          width={20}
          height={20}
          alt="Weather Icon"
          className="scale-90 h-7 w-7 hover:scale-75 duration-500"
          src="https://res.cloudinary.com/js-media/image/upload/v1703735860/portfolio/win11/icons/gjsbula9edftwkm5grtr.webp"
        />
      </div>
      <div id="taskbar-icons" className="flex flex-row items-center space-x-2 ml-36">
        <div id="windows-icon" className="hover:bg-white-transparent duration-500 p-1.5 rounded hover:visible">
          <Image
            width={30}
            height={30}
            alt="Windows Icon"
            className="scale-90 h-7 w-7 hover:scale-75 duration-500"
            src="https://res.cloudinary.com/js-media/image/upload/v1703735860/portfolio/win11/icons/dzzpw39dqqu7htmkdm76.webp"
          />
        </div>
        {icons.map((icon, index) => (
          <TaskbarIcon
            icon={icon.icon}
            title={icon.title}
            key={String(index)}
            isActive={isWindowOpen(icon.id)}
            onClick={(active) => openAboutMe(active, icon)}
          />
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
        <div id="wvb" className="flex flex-row gap-4 px-4 hover:bg-white-transparent rounded duration-500">
          <Image
            width={30}
            height={40}
            src="https://res.cloudinary.com/js-media/image/upload/v1703736560/portfolio/win11/icons/izonkigx8htqcaib4ygy.webp"
            alt=""
            className="h-4 w-4"
          />
          <Image
            width={30}
            height={40}
            src="https://res.cloudinary.com/js-media/image/upload/v1703736560/portfolio/win11/icons/wssk3k3ks9vyewzua4oi.webp"
            alt=""
            className="h-4 w-4"
          />
          <Image
            width={30}
            height={40}
            src="https://res.cloudinary.com/js-media/image/upload/v1703736560/portfolio/win11/icons/sruoyqiy6vhvhighdros.webp"
            alt=""
            className="h-4 w-4"
          />
        </div>
        <Watch />
      </div>
    </div>
  );
};

export default TaskBar;
