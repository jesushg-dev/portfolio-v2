import React, { FC } from 'react';

interface ITerminalProps {
  children: React.ReactNode;
}

const Terminal: FC<ITerminalProps> = ({ children }) => {
  return (
    <div className="text-neutralText-50 w-full overflow-hidden rounded-lg bg-background-900 shadow-2xl">
      <div className="border-b border-gray-800 py-2 px-4">
        <div className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500" />
        <div className="mr-2 inline-block h-3 w-3 rounded-full bg-yellow-300" />
        <div className="mr-2 inline-block h-3 w-3 rounded-full bg-green-400" />
      </div>
      <div className="text-md whitespace-pre">
        <div className="mx-8 my-2 overflow-x-auto text-slate-300">{children}</div>
      </div>
    </div>
  );
};

export default Terminal;
