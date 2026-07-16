"use client";

import type { FC, MouseEvent } from "react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { BiArrowFromBottom } from "react-icons/bi";
import { useTranslations } from "next-intl";

const ScrollToTop: FC = () => {
  const t = useTranslations("global.header");
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = (e: MouseEvent<HTMLButtonElement>) => {
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
        aria-label={t("scrollToTop")}
        className={clsx(
          isVisible ? "opacity-100" : "opacity-0",
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center rounded-full p-3 shadow-xs transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
        )}
      >
        <BiArrowFromBottom className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ScrollToTop;
