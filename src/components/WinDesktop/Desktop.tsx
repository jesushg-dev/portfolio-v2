'use client';

import React, { FC, ReactElement, useState, useRef, useCallback } from 'react';

import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { DndContext, DragEndEvent, DragOverlay, UniqueIdentifier } from '@dnd-kit/core';

import useSize from '@/hooks/useSize';
import DesktopIcon, { IDesktopIcon } from './DesktopIcon';

const IconSize = { height: 100, width: 100 };

const icons: IDesktopIcon[] = [
  {
    id: 'icon-0',
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-about-me-96_x6fa0e.webp',
    label: 'About Me',
  },
  {
    id: 'icon-1',
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-mail-96_upmhx3.webp',
    label: 'Mail',
  },
  {
    id: 'icon-2',
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-portfolio-96_opfju0.webp',
    label: 'Portfolio',
  },
  {
    id: 'icon-3',
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-resume-96-alt_wcl4bp.webp',
    label: 'Resume',
  },
  {
    id: 'icon-4',
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-rss-96_wxhdyp.webp',
    label: 'Blog',
  },
];

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
      className="border-2 border-red-500 h-24 w-24 flex items-center justify-center"
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
console.log('🚀 ~ file: Desktop.tsx:94 ~ initialState:', initialState);

const Desktop: FC<IDesktopProps> = ({}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(ref);
  const [parents, setParents] = useState<Record<UniqueIdentifier, UniqueIdentifier | null>>(initialState);

  //get total number of icons that can fit on the div and also add some extra icons due not being able to fit perfectly
  const totalIcons = Math.floor((width / IconSize.width) * (height / IconSize.height)) + 3;

  const DraggableMarkup = useCallback(
    ({ id }: { id: number }) => {
      const icon = parents[id] !== null ? icons.find((icon) => icon.id === parents[id]) : undefined;

      if (icon === undefined) {
        return <div className="border-red-500 border-2 h-24 w-24" />;
      }

      return (
        <Draggable id={id}>
          <DesktopIcon id={icon.id} icon={icon.icon} label={icon.label} />
        </Draggable>
      );
    },
    [parents]
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    // Check if the drag ended outside of a droppable area
    if (!over) return;

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
    <div ref={ref} className="absolute top-0 left-0 w-full h-full flex flex-wrap">
      <DndContext onDragEnd={handleDragEnd}>
        {[...Array(totalIcons)].map((_, id) => (
          <Droppable key={id} id={id}>
            <DraggableMarkup id={id} />
          </Droppable>
        ))}
      </DndContext>
    </div>
  );
};

export default Desktop;
