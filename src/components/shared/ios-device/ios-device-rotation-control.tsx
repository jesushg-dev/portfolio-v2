"use client";

import {
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

interface IOSDeviceRotationControlProps {
  className: string;
  label: string;
  hidden?: boolean;
  getYaw: () => number;
  onRotate: (radians: number) => void;
}

export function IOSDeviceRotationControl({
  className,
  label,
  hidden,
  getYaw,
  onRotate,
}: IOSDeviceRotationControlProps) {
  const drag = useRef<{ pointer: number; x: number; angle: number } | null>(
    null,
  );
  const moved = useRef(false);

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    moved.current = false;
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      angle: getYaw(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    if (!moved.current && Math.abs(dx) < 5) return;
    moved.current = true;
    onRotate(
      drag.current.angle +
        (dx / Math.max(1, event.currentTarget.clientWidth)) * Math.PI * 2,
    );
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointer === event.pointerId) drag.current = null;
  }

  function click(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0 || !moved.current) {
      const halfTurn = Math.round(getYaw() / Math.PI);
      onRotate((halfTurn + 1) * Math.PI);
    }
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    onRotate(getYaw() + ((event.key === "ArrowLeft" ? -1 : 1) * Math.PI) / 6);
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      hidden={hidden}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onClick={click}
      onKeyDown={keyboard}
    />
  );
}
