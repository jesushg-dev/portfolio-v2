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
      onClick={onClick}
      className="w-10 group aspect-square rounded hover:bg-white/10 select-none hover:ring-1 ring-white/5 p-2">
      <Image src={icon} alt={label} width={80} height={80} />
      <div className="hidden absolute group-hover:flex -mt-[4.6rem] bg-black/80 px-3 p-1.5 select-none hover:ring-1 ring-white/5 rounded text-sm fadein">
        <p className="w-max text-white">{label}</p>
      </div>
    </button>
  );
};

export default TaskbarIcon;
