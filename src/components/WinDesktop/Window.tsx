"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";

import { useDesktopContext } from "@/hoc/DesktopContextProvider";

const windowVariants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
    },
  },
};

interface WindowProps {
  title: string;
  isFocused?: boolean;
  children: React.ReactNode;
  size?: { width: number; height: number };
  onClosed?: () => void;
  onMinimized?: () => void;
}

const defaultSize = { width: 400, height: 300 };

const Window: React.FC<WindowProps> = ({
  title,
  children,
  size = defaultSize,
  onClosed,
  onMinimized,
  isFocused,
}) => {
  const { sizeScreen } = useDesktopContext();

  const isResizing = useRef(false);
  const [sizeState, setSizeState] = useState(size);
  const [isMaximized, setIsMaximized] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "window",
    // modifiers: [restrictToWindowEdges],
  });

  const handleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setSizeState({ ...size });
      return;
    }
    setIsMaximized(true);
    setSizeState({ ...sizeScreen });
  };

  /*  handle resize
  const handleResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setSizeState((prev) => ({
      width: prev.width + e.movementX,
      height: prev.height + e.movementY,
    }));
  };
  */

  // Mouse down handler to start resizing
  const handleMouseDown = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    isResizing.current = true;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    // Update the size based on mouse movement
    setSizeState((prev) => ({
      width: prev.width + e.movementX,
      height: prev.height + e.movementY,
    }));
  }, []);

  // Mouse up handler to stop resizing
  const handleMouseUp = () => {
    isResizing.current = false;
  };

  // UseEffect to add global event listeners
  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove]);

  return (
    <motion.div
      className={`absolute flex flex-col border border-gray-500 bg-gray-800 p-0.5 shadow-lg ${
        isFocused ? "z-10" : "z-0"
      }`}
      style={{
        ...transform,
        width: sizeState.width,
        height: sizeState.height,
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial="hidden"
      animate="visible"
      variants={windowVariants}
      drag
      dragConstraints={{
        left: 0,
        right: window ? window.innerWidth - 300 : 0, // Window width (considering the taskbar width)
        top: 0,
        bottom: window ? window.innerHeight - 30 : 0, // Window height (considering the taskbar height)
      }}
      dragElastic={0.1}
    >
      {/* Window content */}
      <div className="flex items-center justify-between">
        <div>{title}</div>
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-1 hover:bg-gray-900"
            onClick={onMinimized}
          >
            _
          </button>
          <button
            type="button"
            className="px-4 py-1 hover:bg-yellow-600"
            onClick={handleMaximize}
          >
            []
          </button>
          <button
            type="button"
            className="px-4 py-1 hover:bg-red-600"
            onClick={onClosed}
          >
            x
          </button>
        </div>
      </div>
      <div className="flex-1">{children}</div>
      {isResizing && (
        <button
          type="button"
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-gray-500"
          onMouseDown={handleMouseDown}
        />
      )}
    </motion.div>
  );
};

export default Window;
