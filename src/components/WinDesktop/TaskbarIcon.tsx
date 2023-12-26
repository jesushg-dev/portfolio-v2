import React from 'react';

import Image from 'next/image';

export interface ITaskbarIcon {
  icon: string;
  label: string;
  onClick?: () => void;
}

const TaskbarIcon: React.FC<ITaskbarIcon> = ({ icon, label, onClick }) => {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-white-transparent hover:bg-opacity-80 dark:hover:bg-black dark:hover:bg-opacity-20 duration-200 cursor-auto">
      <img width={32} src={icon} className="transform active:scale-75 duration-150 " />
    </button>
  );
};

export default TaskbarIcon;
