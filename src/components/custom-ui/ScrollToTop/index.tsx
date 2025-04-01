"use client";

import type { FC } from "react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { BiArrowFromBottom } from "react-icons/bi";

const ScrollToTop: FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    e.preventDefault();
    e.currentTarget.blur();
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed right-2 bottom-2 z-50">
      <button
        type="button"
        onClick={scrollToTop}
        className={clsx(
          isVisible ? "opacity-100" : "opacity-0",
          "bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex items-center rounded-full p-3 text-white shadow-xs transition-opacity focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
        )}
      >
        <BiArrowFromBottom className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ScrollToTop;
