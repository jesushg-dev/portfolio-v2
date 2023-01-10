import React, { FC, useState } from 'react';

import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

interface IToolbarHeaderProps {}

const ToolbarHeader: FC<IToolbarHeaderProps> = ({}) => {
  const [open, setOpen] = useState(false);

  const toogleOpen = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="flex items-center md:order-2">
      <button
        type="button"
        onClick={toogleOpen}
        data-collapse-toggle="mobile-menu-language-select"
        className="ml-1 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden"
        aria-controls="mobile-menu-language-select"
        aria-expanded={open}>
        <span className="sr-only">Open main menu</span>
        {open ? (
          <RiCloseLine aria-hidden="true" className="h-6 w-6" />
        ) : (
          <RiMenu3Line aria-hidden="true" className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default ToolbarHeader;
