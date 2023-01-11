import React, { FC } from 'react';

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
        className="block w-full rounded py-2 pl-3 pr-4 text-start text-gray-900 transition-all hover:bg-gray-100 hover:text-blue-700 md:w-auto md:bg-transparent md:text-inherit">
        {title}
      </button>
    </li>
  );
};

export default NavButton;
