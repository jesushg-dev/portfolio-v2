import React from "react";
import type { FC } from "react";
import Image from "next/image";

interface IIconButtonProps {
  alt: string;
  src: string;
  title: string;
}

const IconButton: FC<IIconButtonProps> = ({ alt, src, title }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-sm py-2 duration-150 hover:bg-white hover:bg-opacity-50 active:bg-opacity-30 dark:hover:bg-opacity-10 dark:active:bg-opacity-5">
      <Image alt={alt} height={14} src={src} width={24} />
      <span className="text-2xs text-center font-medium text-gray-800 dark:text-gray-200">
        {title}
      </span>
    </div>
  );
};

export default IconButton;
