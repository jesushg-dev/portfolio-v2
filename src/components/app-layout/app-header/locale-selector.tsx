"use client";

import type { FC, KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/routing";
import { appLocales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import {
  headerLabelTextStyles,
  headerPillControlStyles,
} from "@/components/app-layout/app-header/toolbar-control-styles";

interface LocaleSelectorProps {
  inverted?: boolean;
}

function LocaleMenuLabel({
  localeCode,
  nativeName,
  localizedName,
}: {
  localeCode: Locale;
  nativeName: string;
  localizedName: string;
}) {
  const showLocalizedHint = nativeName !== localizedName;

  return (
    <span className="flex min-w-0 flex-col gap-0.5 leading-snug">
      <span lang={localeCode} className="text-sm font-medium tracking-tight">
        {nativeName}
      </span>
      {showLocalizedHint ? (
        <span className="text-muted-foreground text-sm font-normal">
          {localizedName}
        </span>
      ) : null}
    </span>
  );
}

const LocaleSelector: FC<LocaleSelectorProps> = ({ inverted = false }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("global.header");
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const sortedLocales = useMemo(
    () =>
      [...appLocales].sort((a, b) =>
        a.label.localeCompare(b.label, locale, { sensitivity: "base" }),
      ),
    [locale],
  );

  const currentLocale = useMemo(
    () => appLocales.find((entry) => entry.value === locale),
    [locale],
  );

  const triggerLabel = currentLocale?.label ?? t("menu.language");
  const triggerAriaLabel = currentLocale
    ? `${t("menu.language")}: ${triggerLabel}`
    : t("menu.language");

  const onChangeHandler = useCallback(
    (nextLocale: string | null) => {
      setIsOpen(false);
      if (!nextLocale || nextLocale === locale) return;
      startTransition(() => {
        // @ts-expect-error - Next-Intl typing for dynamic routes returned by usePathname
        router.replace({ pathname, params }, { locale: nextLocale });
      });
    },
    [locale, pathname, params, router, startTransition],
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (isPending) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const initialIndex = sortedLocales.findIndex((l) => l.value === locale);
        setFocusedIndex(initialIndex >= 0 ? initialIndex : 0);
      }
      return next;
    });
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setIsOpen(true);
        const initialIndex = sortedLocales.findIndex((l) => l.value === locale);
        setFocusedIndex(initialIndex >= 0 ? initialIndex : 0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % sortedLocales.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex(
        (prev) => (prev - 1 + sortedLocales.length) % sortedLocales.length,
      );
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < sortedLocales.length) {
        onChangeHandler(sortedLocales[focusedIndex].value);
        triggerRef.current?.focus();
      }
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid="locale-selector"
        aria-label={triggerAriaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-busy={isPending}
        disabled={isPending}
        onClick={handleTriggerClick}
        className={cn(
          headerPillControlStyles(inverted, { active: isOpen }),
          "gap-1 py-0! pr-1.5 pl-2",
          "h-11! min-h-11! text-sm!",
          "[&>svg:last-child]:size-3 [&>svg:last-child]:opacity-60",
          isPending && "opacity-70",
        )}
      >
        <Globe aria-hidden className="size-3.5 shrink-0 opacity-80" />
        <span lang={locale} className={headerLabelTextStyles}>
          {triggerLabel}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3 shrink-0 opacity-60 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("menu.language")}
          tabIndex={-1}
          className="border-border/60 bg-card text-card-foreground absolute top-full right-0 z-50 mt-2 min-w-44 rounded-xl p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          {sortedLocales.map(({ value, label }, index) => {
            const isSelected = value === locale;
            const isFocused = focusedIndex === index;

            return (
              <div
                key={value}
                id={`${listboxId}-option-${value}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => onChangeHandler(value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={cn(
                  "relative flex cursor-pointer items-center justify-between rounded-lg py-2.5 pr-3 pl-2.5 transition-colors outline-none select-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  isFocused && "bg-accent text-accent-foreground",
                  isSelected && "font-medium",
                )}
              >
                <LocaleMenuLabel
                  localeCode={value}
                  nativeName={label}
                  localizedName={t(`menu.locale-options.${value}`)}
                />
                {isSelected && (
                  <Check className="text-primary ml-2 size-4 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocaleSelector;
