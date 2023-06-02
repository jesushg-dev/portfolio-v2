import React, { FC } from 'react';

interface ITimeLineProps {
  title: string;
  text: string;
  date: string;
  dateTime: string;
}

const TimeLine: FC<ITimeLineProps> = ({ title, text, date, dateTime }) => {
  return (
    <li className="time-dot relative w-full space-y-2 pl-4 pb-6">
      <time
        className=" border border-primary-500 bg-background-200 px-2 py-1 pb-1 text-xs font-normal leading-none text-primary-500"
        dateTime={dateTime}>
        {date}
      </time>
      <h3 className="text-base font-semibold text-primaryText-200">{title}</h3>
      <p className="text-sm text-primaryText-800">{text}</p>
    </li>
  );
};

export default TimeLine;
