import type { FC, ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

interface IPhoneMockupProps {
  children: ReactNode;
  className?: string;
  screenRef?: Ref<HTMLDivElement>;
}

const IPhoneMockup: FC<IPhoneMockupProps> = ({
  children,
  className,
  screenRef,
}) => {
  return (
    <div
      className={cn(
        "relative mx-auto h-[38.4375rem] w-[18.75rem] rounded-[2rem] border-[0.1875rem] border-zinc-700 bg-zinc-800 shadow-2xl",
        className,
      )}
    >
      <div className="absolute top-[4.125rem] -left-[0.3125rem] h-7 w-[0.125rem] rounded-s-sm bg-zinc-600" />
      <div className="absolute top-[6.625rem] -left-[0.3125rem] h-10 w-[0.125rem] rounded-s-sm bg-zinc-600" />
      <div className="absolute top-[9.375rem] -left-[0.3125rem] h-10 w-[0.125rem] rounded-s-sm bg-zinc-600" />
      <div className="absolute top-[7.25rem] -right-[0.3125rem] h-12 w-[0.125rem] rounded-e-sm bg-zinc-600" />

      <div
        ref={screenRef}
        className="absolute inset-[0.1875rem] overflow-hidden rounded-[1.9rem] bg-[#191414]"
      >
        <div
          className="pointer-events-none absolute top-[0.375rem] left-1/2 z-30 h-[1.375rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />
        <div className="relative size-full">{children}</div>
      </div>
    </div>
  );
};

export default IPhoneMockup;
