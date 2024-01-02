'use client';

import React, { useState, useEffect, startTransition } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { Rnd } from 'react-rnd';

import { useDesktopContext } from '@/hoc/DesktopContextProvider';
import { useWindowContext } from '@/hoc/WindowContext';
import type { IPosition, ISize } from '@/hoc/WindowContext';

interface IWindowDndProps {
  id: string;
  size: ISize;
  icon: string;
  title: string;
  position: IPosition;
  children: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
}

const WindowDnd: FC<IWindowDndProps> = ({ id, title, children, size, position, isMinimized, icon, isMaximized }) => {
  const { sizeScreen } = useDesktopContext();
  const { toggleMaximizeWindow, toggleMinimizeWindow, destroyWindow } = useWindowContext();

  const [crtSize, setCrtSize] = useState<ISize>(size);
  const [crtPosition, setCrtPosition] = useState<IPosition>(position);

  const onDragStop = (e: any, d: any) => {
    setCrtPosition({ x: d.x, y: d.y });
  };

  const onResizeStop = (e: any, direction: any, ref: any, delta: any, newPosition: IPosition) => {
    setCrtSize({ width: ref.style.width, height: ref.style.height });
    setCrtPosition(newPosition);
  };

  useEffect(() => {
    const newSize = isMaximized ? sizeScreen : size;
    const newPosition = isMaximized ? { x: 0, y: 0 } : position;

    startTransition(() => {
      setCrtSize(newSize);
      setCrtPosition(newPosition);
    });
  }, [isMaximized]);

  if (isMinimized) {
    return null;
  }

  return (
    <Rnd
      size={crtSize}
      position={crtPosition}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      className="bg-gray-800 p-0.5 border border-gray-500 shadow-lg">
      {/* Window content */}
      <div className="h-full w-full flex flex-col bg-background-200">
        <header className="flex justify-between items-center">
          <div className="flex p-2">
            <Image src={icon} alt="icon" width={16} height={16} />
          </div>
          <h1 className="text-primaryText-500 text-xs flex-grow">{title}</h1>
          <div className="flex space-x-2">
            <button
              type="button"
              aria-label="Minimize window"
              onClick={() => toggleMinimizeWindow(id)}
              className="px-5 py-3 hover:bg-background-500 hover:bg-opacity-10 duration-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 10 1"
                className="fill-current text-primaryText-500 w-2 h-2">
                <path d="M10 -0.000976562V1H0V-0.000976562H10Z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Maximize window"
              onClick={() => toggleMaximizeWindow(id)}
              className="px-5 py-3 hover:bg-background-500 hover:bg-opacity-10 duration-100">
              {isMaximized ? (
                <svg
                  data-v-7a68f144=""
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 10 10"
                  className="fill-current text-primaryText-500 w-2 h-2">
                  <path
                    data-v-7a68f144=""
                    d="M10 7.99805H7.99805V10H0V2.00195H2.00195V0H10V7.99805ZM7.00195
              2.99805H1.00098V8.99902H7.00195V2.99805ZM8.99902
              1.00098H2.99805V2.00195H7.99805V7.00195H8.99902V1.00098Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 10 10"
                  className="fill-current text-primaryText-500 w-2 h-2">
                  <path d="M0,0v10h10V0H0z M9,9H1V1h8V9z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              aria-label="Close window"
              onClick={() => destroyWindow(id)}
              className="px-5 py-3 hover:bg-red-500 duration-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 10.2 10.2"
                className="fill-current text-primaryText-500 hover:text-white w-2 h-2">
                <path
                  d="M10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2
                          5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"
                />
              </svg>
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden relative select-none">
          <div className="flex-1 overflow-auto absolute inset-0">{children}</div>
        </main>
      </div>
    </Rnd>
  );
};

export const Windows = () => {
  const windowsContext = useWindowContext();

  return (
    <>
      {windowsContext.windows.map((window) => (
        <WindowDnd key={window.id} {...window}>
          <window.component />
        </WindowDnd>
      ))}
    </>
  );
};

export default WindowDnd;
