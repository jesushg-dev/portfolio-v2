import React, { FC } from 'react';

interface ICodeTextProps {
  label: string;
  value: string;
  indent?: number;
}

const CodeText: FC<ICodeTextProps> = ({ value, label, indent = 2 }) => {
  return (
    <p>
      {' '.repeat(indent)}
      {value}:&nbsp;&nbsp;<span className="text-yellow-300">&apos;{label}&apos;</span>,
    </p>
  );
};

export default CodeText;
