import React, { useState, useEffect, memo, startTransition } from 'react';

const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const getCurrentDate = () => new Date().toLocaleDateString();

const Watch = () => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        setCurrentTime(getCurrentTime());
        setCurrentDate(getCurrentDate());
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="notific"
      className="flex flex-col text-center pl-2 pr-2 py-0.5 hover:bg-white-transparent rounded duration-500">
      <p id="time" className="text-[0.75rem]">
        {currentTime}
      </p>
      <p id="date" className="text-[0.75rem]">
        {currentDate}
      </p>
    </div>
  );
};

export default memo(Watch);
