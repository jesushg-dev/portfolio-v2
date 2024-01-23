"use client";

import React, { useState, useCallback } from "react";
import type { FC, ReactElement } from "react";
import { useDroppable, useDraggable, DndContext } from "@dnd-kit/core";
import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";

import { useWindowContext } from "@/hoc/WindowContext";
import { useDesktopContext } from "@/hoc/DesktopContextProvider";

import icons from "../icons";

import DesktopIcon from "./DesktopIcon";

const IconSize = { height: 100, width: 100 };

interface ICommonProps {
  id: string | number;
  children: ReactElement;
}

export const Droppable: FC<ICommonProps> = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  const style = {
    color: isOver ? "green" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
};

export const Draggable: FC<ICommonProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className="flex h-24 w-24 items-center justify-center"
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
};

interface IDesktopProps {}

const initialState: Record<UniqueIdentifier, UniqueIdentifier> = icons.reduce(
  (acc, icon, index) => {
    acc[index] = icon.id;
    return acc;
  },
  {} as Record<UniqueIdentifier, UniqueIdentifier>,
);

const Desktop: FC<IDesktopProps> = ({}) => {
  const { handleWindow } = useWindowContext();
  const { width, height } = useDesktopContext().sizeScreen;
  const [parents, setParents] =
    useState<Record<UniqueIdentifier, UniqueIdentifier | null>>(initialState);

  // get total number of icons that can fit on the div and also add some extra icons due not being able to fit perfectly
  const totalIcons =
    Math.floor((width / IconSize.width) * (height / IconSize.height)) + 3;
  const iconsArray = [...Array(totalIcons)].map((_, id) => id);

  const DraggableMarkup: FC<{ id: number }> = useCallback(
    ({ id }) => {
      const parentIcon =
        parents[id] !== null
          ? icons.find((icon) => icon.id === parents[id])
          : undefined;

      if (parentIcon === undefined) {
        return <div className="h-24 w-24" />;
      }

      return (
        <Draggable id={id}>
          <DesktopIcon
            id={parentIcon.id}
            icon={parentIcon.icon}
            title={parentIcon.title}
            onClick={() => handleWindow(parentIcon)}
          />
        </Draggable>
      );
    },
    [parents],
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
      {iconsArray.map((id) => (
        <Droppable key={id} id={id}>
          <DraggableMarkup id={id} />
        </Droppable>
      ))}
    </DndContext>
  );
};

export default Desktop;
