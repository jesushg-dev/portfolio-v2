import React, { FC } from 'react';

interface ITimeLineProps {
  title: string;
  text: string;
  date: string;
  dateTime: string;
}

const TimeLine: FC<ITimeLineProps> = ({ title, text, date, dateTime }) => {
  return (
    <li className="time-dot relative mb-6 ml-4">
      <time className="mb-1 text-sm font-normal leading-none text-gray-600" dateTime={dateTime}>
        {date}
      </time>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-justify text-sm text-gray-800 line-clamp-3">{text}</p>
    </li>
  );
};

export default TimeLine;
