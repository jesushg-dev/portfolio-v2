import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { siLoader } from "@/utils/tools/image";

interface ISkillItemProps {
  id: string;
  image: string;
  title: string;
  description: string;
  onClick?: () => void;
}

const SkillItem: FC<ISkillItemProps> = ({
  id,
  image,
  title,
  description,
  onClick,
}) => {
  /* border border-primary-50 bg-background-50/50 shadow backdrop-blur-xl */
  return (
    <div id={id} className="group flex h-full w-full">
      <button
        type="button"
        title={title}
        onClick={onClick}
        className="flex grow cursor-pointer flex-col items-center gap-4 rounded-lg p-4 shadow-xs transition-transform hover:scale-110 hover:transform hover:shadow-lg"
      >
        <span className="bg-background-100 relative block h-8 w-8 rounded-full">
          <Image
            width={32}
            height={32}
            src={image}
            alt={title}
            loader={siLoader}
          />
        </span>
        <span className="text-primaryText-700 group-hover:text-primary-700 text-center text-xs leading-none font-bold">
          {title}
        </span>
        <span className="text-primaryText-800 hidden text-center text-sm">
          {description}
        </span>
      </button>
    </div>
  );
};

export default SkillItem;
