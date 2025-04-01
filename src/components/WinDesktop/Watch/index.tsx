"use client";

import React, { useCallback } from "react";
import { motion } from "framer-motion";

import useCalendar from "@/hooks/use-calendar";
import Popover, {
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shared/popover";

import WatchBar from "./WatchBar";

const date = new Date();

const Watch = () => {
  const { currentDate, calendarDays, nextMonth, prevMonth } = useCalendar();

  const renderCalendar = useCallback(
    (day: Date) => {
      const dayInCurrentMonth = day.getMonth() === currentDate.getMonth();

      return (
        <motion.div
          key={day.toISOString()}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm duration-150 ${
            dayInCurrentMonth
              ? "hover:bg-opacity-10 dark:hover:bg-opacity-10 bg-transparent text-gray-600 hover:bg-gray-600 dark:text-gray-300 dark:hover:bg-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          {day.getDate()}
        </motion.div>
      );
    },
    [currentDate],
  );

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger
        type="button"
        className="hover:bg-white-transparent hover:bg-opacity-20 relative cursor-auto rounded-sm p-1.5 duration-200 hover:bg-black"
      >
        <WatchBar />
      </PopoverTrigger>
      <PopoverContent className="Popover calendar bg-opacity-80 dark:bg-opacity-50 flex flex-col overflow-hidden rounded-md bg-white shadow-md backdrop-blur-lg backdrop-filter duration-200 dark:bg-gray-600">
        <div className="bg-opacity-5 flex items-center bg-black px-6 py-4">
          <span className="grow text-sm text-gray-700 dark:text-white">
            {date.toLocaleString("default", { weekday: "long" })},{" "}
            {currentDate.getDate()}{" "}
          </span>
          <PopoverClose
            type="button"
            className="border-opacity-20 bg-opacity-10 rounded-md border border-gray-400 bg-gray-400 p-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="rotate-180 transform fill-current text-gray-700 dark:text-gray-200"
              style={{ width: 10, height: 10 }}
            >
              <path d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z" />
            </svg>
          </PopoverClose>
        </div>
        <div className="flex items-center justify-center gap-3 px-6 pt-4">
          <span className="grow text-sm text-gray-700 dark:text-white">
            {currentDate.toLocaleString("default", { month: "long" })}{" "}
            {currentDate.getFullYear()}
          </span>
          <button
            type="button"
            onClick={prevMonth}
            className="hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-center rounded-md duration-150 hover:bg-gray-600 dark:hover:bg-white"
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 27 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current p-2 text-gray-600 dark:text-gray-400"
            >
              <path d="M11.7679 0.999999C12.5378 -0.333335 14.4623 -0.333333 15.2321 1L26.0574 19.75C26.8272 21.0833 25.8649 22.75 24.3253 22.75H2.67468C1.13508 22.75 0.172831 21.0833 0.942632 19.75L11.7679 0.999999Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-center rounded-md duration-150 hover:bg-gray-600 dark:hover:bg-white"
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 27 23"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-180 transform fill-current p-2 text-gray-600 dark:text-gray-400"
            >
              <path d="M11.7679 0.999999C12.5378 -0.333335 14.4623 -0.333333 15.2321 1L26.0574 19.75C26.8272 21.0833 25.8649 22.75 24.3253 22.75H2.67468C1.13508 22.75 0.172831 21.0833 0.942632 19.75L11.7679 0.999999Z" />
            </svg>
          </button>
        </div>
        <div className="grid grow grid-cols-7 grid-rows-6 items-center gap-2 p-4">
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" Su "}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" Mo "}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" Tu "}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" We "}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" Th "}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" Fr "}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-100">
            {" Sa "}
          </div>
          {calendarDays.map(renderCalendar)}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Watch;
