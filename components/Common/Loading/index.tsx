import React, { FC } from 'react';

interface ILoadingProps {
  className?: string;
}

const Loading: FC<ILoadingProps> = ({ className = 'h-32 w-32' }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className={className + ' animate-spin rounded-full border-b-2 border-gray-900'}></div>
    </div>
  );
};

export default Loading;
