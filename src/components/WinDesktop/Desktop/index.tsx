'use client';

import React, { FC, ReactElement, useState, useCallback } from 'react';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { DndContext, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';

import icons from '../icons';
import DesktopIcon from './DesktopIcon';
import { useWindowContext } from '@/hoc/WindowContext';
import { useDesktopContext } from '@/hoc/DesktopContextProvider';

import type { ICreateWindowProps } from '@/hoc/WindowContext';

const IconSize = { height: 100, width: 100 };

interface ICommonProps {
  id: string | number;
  children: ReactElement;
}

export const Droppable: FC<ICommonProps> = (props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });

  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
};

export const Draggable: FC<ICommonProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className="h-24 w-24 flex items-center justify-center"
      style={style}
      {...listeners}
      {...attributes}>
      {props.children}
    </div>
  );
};

interface IDesktopProps {}

const initialState: Record<UniqueIdentifier, UniqueIdentifier> = icons.reduce(
  (acc, icon, index) => {
    acc[index] = icon.id;
    return acc;
  },
  {} as Record<UniqueIdentifier, UniqueIdentifier>
);

const Desktop: FC<IDesktopProps> = ({}) => {
  const { createWindow } = useWindowContext();
  const { width, height } = useDesktopContext().sizeScreen;
  const [parents, setParents] = useState<Record<UniqueIdentifier, UniqueIdentifier | null>>(initialState);

  //get total number of icons that can fit on the div and also add some extra icons due not being able to fit perfectly
  const totalIcons = Math.floor((width / IconSize.width) * (height / IconSize.height)) + 3;

  const DraggableMarkup = useCallback(
    ({ id }: { id: number }) => {
      const icon = parents[id] !== null ? icons.find((icon) => icon.id === parents[id]) : undefined;

      if (icon === undefined) {
        return <div className="h-24 w-24" />;
      }

      const openAboutMe = (data: ICreateWindowProps) => {
        createWindow(data);
      };

      return (
        <Draggable id={id}>
          <DesktopIcon id={icon.id} icon={icon.icon} label={icon.label} onClick={openAboutMe.bind(null, icon)} />
        </Draggable>
      );
    },
    [parents]
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    // Check if the drag ended outside of a droppable area
    if (!over) return;
    if (active.id === over.id) return;

    setParents((prev) => {
      // Extract the dragged icon ID
      const draggedIconId = prev[active.id];

      // Find the next empty spot in the grid
      let nextEmptySpot = Number(over.id);
      while (prev[nextEmptySpot]) {
        nextEmptySpot = (nextEmptySpot + 1) % totalIcons;
        // If we loop back to the original 'over.id', break to prevent an infinite loop
        if (nextEmptySpot === over.id) break;
      }

      // If all spots are full, return the original state
      if (prev[nextEmptySpot]) {
        return prev;
      }

      return {
        ...prev,
        [active.id]: null, // Remove the icon ID from the original position
        [nextEmptySpot]: draggedIconId, // Add the icon ID to the next empty spot
      };
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {[...Array(totalIcons)].map((_, id) => (
        <Droppable key={id} id={id}>
          <DraggableMarkup id={id} />
        </Droppable>
      ))}
    </DndContext>
  );
};

export default Desktop;
