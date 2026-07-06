"use client";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";
import { useRef, useState, type ReactNode, type MouseEvent } from "react";

export const FollowerPointerCard = ({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isInside, setIsInside] = useState<boolean>(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      setIsInside(true);
      const currentRect = ref.current.getBoundingClientRect();
      x.set(e.clientX - currentRect.left);
      y.set(e.clientY - currentRect.top);
    }
  };
  const handleMouseLeave = () => {
    setIsInside(false);
  };

  const handleMouseEnter = () => {
    setIsInside(true);
  };
  return (
    <div
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      style={{
        cursor: "none",
      }}
      ref={ref}
      className={cn("relative", className)}
    >
      <AnimatePresence>
        {isInside && <FollowPointer x={x} y={y} title={title} />}
      </AnimatePresence>
      {children}
    </div>
  );
};

export const FollowPointer = ({
  x,
  y,
  title,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  title?: string | ReactNode;
}) => {
  return (
    <motion.div
      className="absolute z-50 h-4 w-4 rounded-full"
      style={{
        top: y,
        left: x,
        pointerEvents: "none",
      }}
      initial={{
        scale: 1,
        opacity: 1,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
      }}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="1"
        viewBox="0 0 16 16"
        className="text-primary h-6 w-6 -translate-x-[12px] -translate-y-[10px] -rotate-[70deg] transform"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"></path>
      </svg>
      <motion.div
        initial={{
          scale: 0.5,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.5,
          opacity: 0,
        }}
        className={
          "bg-primary text-primary-foreground min-w-max rounded-full px-2 py-2 text-xs whitespace-nowrap shadow-md"
        }
      >
        {title ?? "Click to edit"}
      </motion.div>
    </motion.div>
  );
};
