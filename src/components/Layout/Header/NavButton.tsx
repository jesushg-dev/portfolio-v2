import type { FC } from 'react';
import React from 'react';

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
        className="block w-full rounded py-2 pl-3 pr-4 text-start text-primaryText-900 transition-all hover:bg-background-100 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-background-200 md:w-auto md:bg-transparent md:text-inherit">
        {title}
      </button>
    </li>
  );
};

export default NavButton;
