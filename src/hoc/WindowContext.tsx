'use client';

import React, { createContext, useState, useContext, useMemo } from 'react';
import type { FC } from 'react';

export interface ISize {
  width: number;
  height: number;
}

export interface IPosition {
  x: number;
  y: number;
}

export interface WindowState {
  id: string;
  title: string;
  size: ISize;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: IPosition;
  component: React.ComponentType<any>;
}

export interface ICreateWindowProps extends Pick<WindowState, 'component' | 'id' | 'icon' | 'title'> {
  size?: ISize;
}

interface WindowProviderProps {
  children: React.ReactNode;
}

interface WindowContextType {
  windows: WindowState[];
  destroyWindow: (id: string) => void;
  toggleMinimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  createWindow: (data: ICreateWindowProps) => void;
  setMinimizedWindow: (id: string, isMinimized: boolean) => void;
}

const defaultPosition = { x: 10, y: 10 };
const defaultSize = { width: 400, height: 300 };

const WindowContext = createContext<WindowContextType | undefined>(undefined);

const WindowProvider: FC<WindowProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);

  const createWindow = (props: ICreateWindowProps) => {
    // check if window is open already
    const windowOpen = windows.find((window) => window.id === props.id);

    // if window is open, bring it to front and unminimize it
    if (windowOpen) {
      windowOpen.isMinimized = false;
      setWindows((prev) => [windowOpen, ...prev.filter((window) => window.id !== props.id)]);
      return;
    }

    const newWindow: WindowState = {
      ...props,
      size: props.size || defaultSize,
      isMinimized: false,
      isMaximized: false,
      position: defaultPosition,
    };
    setWindows((currentWindows) => [...currentWindows, newWindow]);
  };

  const destroyWindow = (id: string) => {
    setWindows(windows.filter((window) => window.id !== id));
  };

  const setMinimizedWindow = (id: string, isMinimized: boolean) => {
    setWindows((val) => val.map((window) => (window.id === id ? { ...window, isMinimized } : window)));
  };

  const toggleMinimizeWindow = (id: string) => {
    setWindows((val) =>
      val.map((window) => (window.id === id ? { ...window, isMinimized: !window.isMinimized } : window))
    );
  };

  const toggleMaximizeWindow = (id: string) => {
    setWindows((val) =>
      val.map((window) => (window.id === id ? { ...window, isMaximized: !window.isMaximized } : window))
    );
  };

  const contextValue = useMemo(
    () => ({ windows, createWindow, destroyWindow, toggleMinimizeWindow, toggleMaximizeWindow, setMinimizedWindow }),
    [windows]
  );

  return <WindowContext.Provider value={contextValue}>{children}</WindowContext.Provider>;
};

export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindowContext must be used within a WindowProvider');
  }
  return context;
};

export default WindowProvider;
