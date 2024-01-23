"use client";

import React, { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";

const IntervalTime = 60000;
const getCurrentTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const getCurrentDate = () => new Date().toLocaleDateString();

const WatchBar = () => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(getCurrentDate());
    }, IntervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 scale-90 duration-500 hover:scale-75">
      <motion.p
        id="time"
        className="text-[0.75rem]"
        layout
        transition={{ duration: 0.5 }}
      >
        {currentTime}
      </motion.p>
      <motion.p
        id="date"
        className="text-[0.75rem]"
        layout
        transition={{ duration: 0.5 }}
      >
        {currentDate}
      </motion.p>
    </div>
  );
};

export default memo(WatchBar);
