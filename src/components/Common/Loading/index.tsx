import type { FC } from "react";
import React, { memo } from "react";

interface ILoadingProps {
  className?: string;
}

const Loading: FC<ILoadingProps> = ({ className = "h-32 w-32" }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div
        className={`${className} animate-spin rounded-full border-b-2 border-primary-900`}
      />
    </div>
  );
};

const LoadingFixed: FC<ILoadingProps> = ({ className = "h-32 w-32" }) => {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-primary-100 bg-opacity-80">
      <div
        className={`${className} animate-spin rounded-full border-b-2 border-primary-900`}
      />
    </div>
  );
};

export { LoadingFixed };
export default memo(Loading);
