import React from 'react';

import Image from 'next/image';

export interface ITaskbarIcon {
  icon: string;
  title: string;
  onClick?: (active: boolean) => void;
  isActive: boolean;
}

const TaskbarIcon: React.FC<ITaskbarIcon> = ({ icon, title, onClick, isActive }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick?.bind(null, isActive)}
      className={
        'p-1.5 rounded relative hover:bg-white-transparent hover:bg-black hover:bg-opacity-20 duration-200 cursor-auto' +
        (isActive ? ' bg-white-transparent bg-black bg-opacity-20' : '')
      }>
      <img width={32} src={icon} className="transform active:scale-75 duration-150 " />

      {isActive && <div className="absolute bottom-0.5 left-3 right-3 h-[0.2rem] bg-primary-500 rounded-sm"></div>}
    </button>
  );
};

export default TaskbarIcon;
