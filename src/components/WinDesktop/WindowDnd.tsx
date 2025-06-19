"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  startTransition,
  useCallback,
} from "react";
import type { FC } from "react";
import Image from "next/image";
import { Rnd } from "react-rnd";
import type { DraggableData, Position, ResizableDelta } from "react-rnd";

import { useWindowContext } from "@/hoc/window-context-provider";
import type {
  IPosition,
  ISize,
  WindowState,
} from "@/hoc/window-context-provider";
import { useDesktopContext } from "@/hoc/desktop-context-provider";

interface IWindowDndProps {
  id: string;
  size: ISize;
  icon: string;
  title: string;
  position: IPosition;
  children: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
}

const WindowDnd: FC<IWindowDndProps> = ({
  id,
  size,
  icon,
  title,
  position,
  children,
  isMinimized,
  isFocused,
  isMaximized,
}) => {
  const { sizeScreen } = useDesktopContext();
  const {
    toggleMaximizeWindow,
    toggleMinimizeWindow,
    bringToFront,
    destroyWindow,
  } = useWindowContext();

  const [crtSize, setCrtSize] = useState<ISize>(size);
  const [crtPosition, setCrtPosition] = useState<IPosition>(position);

  const onDragStop = (_e: unknown, data: DraggableData) => {
    setCrtPosition({ x: data.x, y: data.y });
  };

  const onResizeStop = (
    _e: MouseEvent | TouchEvent,
    _dir: unknown,
    elementRef: HTMLElement,
    _delta: ResizableDelta,
    position: Position,
  ) => {
    setCrtSize({
      width: parseFloat(elementRef.style.width),
      height: parseFloat(elementRef.style.height),
    });
    setCrtPosition(position);
  };

  /* const stopPropagation = (e: any) => {
    e.stopPropagation();
    bringToFront(id);
  }; */

  const setWindowSize = useCallback(() => {
    const newSize = isMaximized ? sizeScreen : size;
    const newPosition = isMaximized ? { x: 0, y: 0 } : position;
    setCrtSize(newSize);
    setCrtPosition(newPosition);
  }, [isMaximized, sizeScreen, size, position]);

  useEffect(() => {
    startTransition(() => {
      setWindowSize();
    });
  }, [isMaximized, setWindowSize]);

  if (isMinimized) {
    return null;
  }

  return (
    <Rnd
      size={crtSize}
      position={crtPosition}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      onClick={() => bringToFront(id)}
      style={{ zIndex: isFocused ? 99999 : 1 }}
      className="border border-gray-500 bg-gray-800 p-0.5 shadow-lg"
    >
      <div className="bg-background-200 flex h-full w-full cursor-pointer flex-col">
        <header className="flex items-center justify-between">
          <div className="flex p-2">
            <Image src={icon} alt="icon" width={16} height={16} />
          </div>
          <h1 className="text-primaryText-500 grow text-xs">{title}</h1>
          <div className="flex space-x-2">
            <button
              type="button"
              aria-label="Minimize window"
              onClick={() => toggleMinimizeWindow(id)}
              className="hover:bg-background-500/10 px-5 py-3 duration-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 10 1"
                className="text-primaryText-500 h-2 w-2 fill-current"
              >
                <path d="M10 -0.000976562V1H0V-0.000976562H10Z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Maximize window"
              onClick={() => toggleMaximizeWindow(id)}
              className="hover:bg-background-500/10 px-5 py-3 duration-100"
            >
              {isMaximized ? (
                <svg
                  data-v-7a68f144=""
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 10 10"
                  className="text-primaryText-500 h-2 w-2 fill-current"
                >
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
                  className="text-primaryText-500 h-2 w-2 fill-current"
                >
                  <path d="M0,0v10h10V0H0z M9,9H1V1h8V9z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              aria-label="Close window"
              onClick={() => destroyWindow(id)}
              className="px-5 py-3 duration-100 hover:bg-red-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 10.2 10.2"
                className="text-primaryText-500 h-2 w-2 fill-current hover:text-white"
              >
                <path
                  d="M10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2
                          5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"
                />
              </svg>
            </button>
          </div>
        </header>
        <main className="relative flex flex-1 flex-col overflow-hidden select-none">
          <div className="absolute inset-0 flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </Rnd>
  );
};

const WindowWrapper = React.memo(({ window }: { window: WindowState }) => {
  const MemoizedComponent = useMemo(() => window.component, [window.component]);

  return (
    <WindowDnd key={window.id} {...window}>
      <MemoizedComponent />
    </WindowDnd>
  );
});

export const Windows = () => {
  const windowsContext = useWindowContext();

  return (
    <>
      {windowsContext.windows.map((window) => (
        <WindowWrapper key={window.id} window={window} />
      ))}
    </>
  );
};

export default WindowDnd;
