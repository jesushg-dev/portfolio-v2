import React, { FC, memo } from 'react';

export type TooltipProps = {
  text: string;
  children: React.ReactNode;
  className?: string;
};
//whitespace-nowrap
const Tooltip: FC<TooltipProps> = ({ text, children, className = '' }) => {
  return (
    <div className="group relative">
      <span
        className={
          className +
          "pointer-events-none absolute -top-10 left-1/2 z-20 -translate-x-1/2 rounded bg-black px-2 py-1 text-justify text-sm text-white opacity-0 transition before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-black before:content-[''] group-hover:opacity-100 "
        }>
        {text}
      </span>
      {children}
    </div>
  );
};

export default memo(Tooltip);
