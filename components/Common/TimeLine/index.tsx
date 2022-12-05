import React, { FC } from 'react';

interface ITimeLineProps {
  title: string;
  text: string;
  date: string;
}

const TimeLine: FC<ITimeLineProps> = ({ title, text, date }) => {
  return (
    <li className="time-dot mb-6 ml-4 relative">
      <time className="mb-1 text-sm font-normal leading-none text-gray-600">{date}</time>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="line-clamp-3 text-gray-800 text-sm text-justify">{text}</p>
    </li>
  );
};

export default TimeLine;
