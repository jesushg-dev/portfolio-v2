import React, { FC } from 'react';

interface ITerminalProps {
  children: React.ReactNode;
}

const Terminal: FC<ITerminalProps> = ({ children }) => {
  return (
    <div className="rounded-lg shadow-xl bg-gray-900 text-white w-full overflow-x-auto">
      <div className="border-b border-gray-800 py-2 px-4">
        <div className="inline-block w-3 h-3 mr-2 rounded-full bg-red-500" />
        <div className="inline-block w-3 h-3 mr-2 rounded-full bg-yellow-300" />
        <div className="inline-block w-3 h-3 mr-2 rounded-full bg-green-400" />
      </div>
      <div className="px-8 py-2 whitespace-pre text-md">{children}</div>
    </div>
  );
};

export default Terminal;
