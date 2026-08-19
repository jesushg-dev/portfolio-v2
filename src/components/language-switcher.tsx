"use client";

import { useLocale } from "next-intl";
import {
  type Locale,
  locales,
  localsDisplay,
} from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState, useRef, useTransition, type KeyboardEvent, type RefObject } from "react";
import { useClickAway } from "@/hooks/use-click-away";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useClickAway(dropdownRef as RefObject<HTMLElement>, () => setIsOpen(false));

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    startTransition(() => {
      // @ts-expect-error - Next-Intl typing for dynamic routes returned by usePathname
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        if (!isOpen) {
          optionRefs.current[0]?.focus();
        }
        break;
      case "ArrowDown":
        if (isOpen) {
          e.preventDefault();
          optionRefs.current[0]?.focus();
        }
        break;
      case "Escape":
        if (isOpen) {
          e.preventDefault();
          closeDropdown();
        }
        break;
    }
  };

  const handleOptionKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        switchLocale(locales[index]);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (index > 0) {
          optionRefs.current[index - 1]?.focus();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (index < locales.length - 1) {
          optionRefs.current[index + 1]?.focus();
        }
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        disabled={isPending}
        className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {localsDisplay[locale]}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="ring-opacity-5 absolute top-full z-50 mt-1 w-40 rounded-md bg-white py-1 shadow-lg ring-1 ring-black dark:bg-gray-800"
          role="menu"
        >
          {locales.map((lang, index) => (
            <button
              key={lang}
              ref={(el) => {
                if (el) {
                  optionRefs.current[index] = el;
                }
              }}
              onClick={() => switchLocale(lang)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-hidden dark:hover:bg-gray-700 dark:focus:bg-gray-700 ${locale === lang ? "bg-gray-50 dark:bg-gray-700" : ""} `}
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
            >
              {localsDisplay[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
