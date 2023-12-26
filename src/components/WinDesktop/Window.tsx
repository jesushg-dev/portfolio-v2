import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface WindowProps {
  title: string;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({ title, children }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'window',
    // modifiers: [restrictToWindowEdges],
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsFocused(true);
    setIsResizing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsResizing(false);
  };

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

  return (
    <motion.div
      className={`absolute bg-white p-4 border border-gray-500 shadow-lg ${isFocused ? 'z-10' : 'z-0'}`}
      style={{
        ...transform,
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial="hidden"
      animate="visible"
      variants={windowVariants}
      drag={true}
      dragConstraints={{
        left: 0,
        right: window ? window.innerWidth - 300 : 0, // Window width (considering the taskbar width)
        top: 0,
        bottom: window ? window.innerHeight - 30 : 0, // Window height (considering the taskbar height)
      }}
      dragElastic={0.1}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}>
      {/* Window content */}
      <div className="flex justify-between items-center mb-2">
        <div>{title}</div>
        <div className="flex space-x-2">
          <button onClick={() => setIsFocused((prevState) => !prevState)}>_</button>
          <button onClick={() => console.log('Close')}>x</button>
        </div>
      </div>
      <div>{children}</div>
      {isResizing && (
        <div
          role="separator"
          className="absolute right-0 bottom-0 w-4 h-4 bg-gray-500 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
      )}
    </motion.div>
  );
};

export default Window;
