import React, { useState, useCallback } from "react";
import type { FC } from "react";

export type DirectionType = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
//  export type DirectionType = 'up' | 'down' | 'left' | 'right' | 'up-right' | 'up-left' | 'down-right' | 'down-left';

export type MovementDirectionType = {
  horizontal: DirectionType;
  vertical: DirectionType;
};

export interface IDraggableDivSizeProps {
  className?: string;
  onStopDrag?: () => void;
  onDrag?: (direction: DirectionType, deltaX: number, deltaY: number) => void;
}

const DraggableDiv: FC<IDraggableDivSizeProps> = ({
  className,
  onDrag,
  onStopDrag,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<DirectionType>();
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      setIsDragging(true);
      setLastPosition({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (isDragging) {
        const currentX = event.clientX;
        const currentY = event.clientY;
        const deltaX = currentX - lastPosition.x;
        const deltaY = currentY - lastPosition.y;

        let newDirection: DirectionType = "n";

        // Check for diagonal movements
        if (deltaX > 0 && deltaY < 0) {
          newDirection = "ne";
        } else if (deltaX < 0 && deltaY < 0) {
          newDirection = "nw";
        } else if (deltaX > 0 && deltaY > 0) {
          newDirection = "se";
        } else if (deltaX < 0 && deltaY > 0) {
          newDirection = "sw";
        }
        // Check for straight movements
        else if (deltaX > 0) {
          newDirection = "e";
        } else if (deltaX < 0) {
          newDirection = "w";
        } else if (deltaY > 0) {
          newDirection = "s";
        } else if (deltaY < 0) {
          newDirection = "n";
        }

        if (onDrag) {
          onDrag(newDirection, deltaX, deltaY);
        }
        setDirection(newDirection);
        setLastPosition({ x: currentX, y: currentY });
      }
    },
    [isDragging, lastPosition, onDrag],
  );

  const handleMouseUp = () => {
    if (onStopDrag) {
      onStopDrag();
    }
    setIsDragging(false);
  };

  return (
    <button
      type="button"
      className={`absolute z-50 cursor-se-resize ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <p>Movement: {direction} </p>
    </button>
  );
};

export default DraggableDiv;
