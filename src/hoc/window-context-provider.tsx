"use client";

import React, { createContext, useState, useContext, useMemo } from "react";
import type { FC } from "react";

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
  isFocused: boolean;
  component: React.ComponentType<unknown>;
}

export interface IHandleWindowProps
  extends Pick<WindowState, "component" | "id" | "icon" | "title"> {
  size?: ISize;
}

interface WindowProviderProps {
  children: React.ReactNode;
}

interface WindowContextType {
  windows: WindowState[];
  bringToFront: (id: string) => void;
  destroyWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  toggleMinimizeWindow: (id: string) => void;
  handleWindow: (data: IHandleWindowProps) => void;
  setMinimizedWindow: (id: string, isMinimized: boolean) => void;
}

const defaultPosition = { x: 10, y: 10 };
const defaultSize = { width: 400, height: 300 };

const WindowContext = createContext<WindowContextType | undefined>(undefined);

const WindowProvider: FC<WindowProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);

  const contextValue = useMemo(() => {
    const toggleWindowFocusAndMinimize = (targetWindow: WindowState) => {
      setWindows((prev) =>
        prev.map((window) => {
          if (window === targetWindow) {
            return {
              ...window,
              isFocused: true,
              isMinimized: window.isFocused
                ? !window.isMinimized
                : window.isMinimized,
            };
          }
          return {
            ...window,
            // Only remove focus from other windows if the target window wasn't already focused
            isFocused:
              window.isFocused && !targetWindow.isFocused
                ? false
                : window.isFocused,
          };
        }),
      );
    };

    const bringToFront = (id: string) => {
      // remove focus from all windows and set focus to the one clicked
      setWindows((prev) =>
        prev.map((window) =>
          window.id === id
            ? { ...window, isFocused: true }
            : { ...window, isFocused: false },
        ),
      );
    };

    const createWindow = (props: IHandleWindowProps) => {
      const newWindow: WindowState = {
        ...props,
        size: props.size ?? defaultSize,
        isMinimized: false,
        isMaximized: false,
        position: defaultPosition,
        isFocused: true,
      };

      setWindows((prev) => [
        ...prev.map((window) => ({ ...window, isFocused: false })),
        newWindow,
      ]);
    };

    const handleWindow = (props: IHandleWindowProps) => {
      // check if window is open already
      const windowOpen = windows.find((window) => window.id === props.id);
      if (windowOpen) {
        toggleWindowFocusAndMinimize(windowOpen);
      } else {
        createWindow(props);
      }
    };

    const destroyWindow = (id: string) => {
      setWindows(windows.filter((window) => window.id !== id));
    };

    const setMinimizedWindow = (id: string, isMinimized: boolean) => {
      setWindows((val) =>
        val.map((window) =>
          window.id === id ? { ...window, isMinimized } : window,
        ),
      );
    };

    const toggleMinimizeWindow = (id: string) => {
      setWindows((val) =>
        val.map((window) =>
          window.id === id
            ? { ...window, isMinimized: !window.isMinimized }
            : window,
        ),
      );
    };

    const toggleMaximizeWindow = (id: string) => {
      setWindows((val) =>
        val.map((window) =>
          window.id === id
            ? { ...window, isMaximized: !window.isMaximized }
            : window,
        ),
      );
    };

    return {
      windows,
      bringToFront,
      handleWindow,
      destroyWindow,
      toggleMinimizeWindow,
      toggleMaximizeWindow,
      setMinimizedWindow,
    };
  }, [windows]);

  return (
    <WindowContext.Provider value={contextValue}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error("useWindowContext must be used within a WindowProvider");
  }
  return context;
};

export default WindowProvider;
