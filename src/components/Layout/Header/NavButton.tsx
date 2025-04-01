import type { FC } from "react";
import React from "react";

interface INavButtonProps {
  title: string;
  onClick: () => void;
}

const NavButton: FC<INavButtonProps> = ({ title, onClick }) => {
  return (
    <li>
      <button
        type="button"
        title={title}
        onClick={onClick}
        className="text-primaryText-900 hover:bg-background-100 hover:text-primary-700 focus:ring-background-200 block w-full rounded-sm py-2 pr-4 pl-3 text-start transition-all focus:ring-2 focus:outline-hidden md:w-auto md:bg-transparent md:text-inherit"
      >
        {title}
      </button>
    </li>
  );
};

export default NavButton;
