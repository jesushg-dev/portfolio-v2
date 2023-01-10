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
        className="border-b-2 border-transparent px-2 py-4 text-sm hover:border-blue-700 hover:text-blue-700 md:px-3 lg:px-6">
        {title}
      </button>
    </li>
  );
};

/**
<li>
    <button
    type="button"
    title={t('menu.skills')}
    onClick={handleScroll.bind(null, 'home')}
    className="block rounded bg-blue-700 py-2 pl-3 pr-4 text-white hover:bg-gray-100 md:bg-transparent md:text-blue-700">
    {t('menu.home')}
    </button>
</li>

<li>
    <a href="#" className="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 ">
    {t('menu.contact')}
    </a>
</li>
                
*/

export default NavButton;
