import type { FC } from "react";
import React, { memo } from "react";

interface ILoadingProps {
  className?: string;
}

const Loading: FC<ILoadingProps> = ({ className = "h-32 w-32" }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div
        className={`${className} border-primary-900 animate-spin rounded-full border-b-2`}
      />
    </div>
  );
};

const LoadingFixed: FC<ILoadingProps> = ({ className = "h-32 w-32" }) => {
  return (
    <div className="bg-primary-100/80 fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center">
      <div
        className={`${className} border-primary-900 animate-spin rounded-full border-b-2`}
      />
    </div>
  );
};

export { LoadingFixed };
export default memo(Loading);
