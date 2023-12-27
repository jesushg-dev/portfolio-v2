'use client';

import React, { FC, useState, useEffect, startTransition } from 'react';

import { Rnd } from 'react-rnd';
import { useDesktopContext } from '@/hoc/DesktopContextProvider';

interface Size {
  width: string | number;
  height: string | number;
}

interface Position {
  x: number;
  y: number;
}

interface IWindowDndProps {
  title: string;
  children: React.ReactNode;
  size?: { width: number; height: number };
  onClosed?: () => void;
  onMinimized?: () => void;
}

const defaultSize = { width: 400, height: 300 };

const WindowDnd: FC<IWindowDndProps> = ({ title, children, size = defaultSize, onClosed, onMinimized }) => {
  const { sizeScreen } = useDesktopContext();
  const [crtSize, setCrtSize] = useState<Size>(size);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 10, y: 10 });

  const handleMaximize = () => {
    /*if (isMaximized) {
      setIsMaximized(false);
      setCrtSize({ ...size });
      return;
    }
    setIsMaximized(true);
    setPosition({ x: 10, y: 10 });
    setCrtSize({ ...sizeScreen });*/
  };

  const onDragStop = (e: any, d: any) => {
    setPosition({ x: d.x, y: d.y });
  };

  const onResizeStop = (e: any, direction: any, ref: any, delta: any, newPosition: Position) => {
    setCrtSize({ width: ref.style.width, height: ref.style.height });
    setPosition(newPosition);
  };

  useEffect(() => {
    const newSize = isMaximized ? sizeScreen : size;
    const newPosition = isMaximized ? { x: 0, y: 0 } : position;

    startTransition(() => {
      setCrtSize(newSize);
      setPosition(newPosition);
    });
  }, [isMaximized]);

  return (
    <Rnd
      className="bg-gray-800 p-0.5 border border-gray-500 shadow-lg"
      size={crtSize}
      position={position}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}>
      {/* Window content */}
      <div className="h-full w-full flex flex-col">
        <header className="flex justify-between items-center">
          <h1>
            <span className="text-gray-400">{'<'}</span>
            <span className="text-gray-300">{'>'}</span>
            {title}
          </h1>
          <div className="flex space-x-2">
            <button className="px-4 py-1 hover:bg-gray-900" onClick={onMinimized} aria-label="Minimize window">
              _
            </button>
            <button
              className="px-4 py-1 hover:bg-yellow-800"
              onClick={() => setIsMaximized((e) => !e)}
              aria-label="Maximize window">
              []
            </button>
            <button className="px-4 py-1 hover:bg-red-600" onClick={onClosed} aria-label="Close window">
              x
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </Rnd>
  );
};

export default WindowDnd;
