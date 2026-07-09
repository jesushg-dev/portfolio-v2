import type { FC } from "react";
import { useTransition, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/routing";
import { appLocales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { toolbarControlStyles } from "@/components/app-layout/app-header/toolbar-control-styles";

interface LocaleSelectorProps {
  /** Light glass styling for the transparent hero header. */
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
        <span className="text-muted-foreground text-xs font-normal">
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
  const t = useTranslations("global.header");
  const [isPending, startTransition] = useTransition();

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

  const onChangeHandler = (nextLocale: string | null) => {
    if (!nextLocale || nextLocale === locale) return;
    startTransition(() => {
      // @ts-expect-error - Next-Intl typing for dynamic routes returned by usePathname
      router.replace(pathname, { locale: nextLocale });
      router.refresh();
    });
  };

  return (
    <Select value={locale} disabled={isPending} onValueChange={onChangeHandler}>
      <SelectTrigger
        size="default"
        aria-label={triggerAriaLabel}
        aria-busy={isPending}
        className={cn(
          toolbarControlStyles(inverted),
          "min-w-34 gap-1.5 border py-0! pr-2 pl-3 shadow-none",
          "h-9! max-h-9! min-h-9! data-[size=default]:h-9! data-[size=default]:min-h-9!",
          "leading-none [&>svg:last-child]:size-3.5",
          isPending && "opacity-70",
        )}
      >
        <Globe className="size-3.5 shrink-0 opacity-90" aria-hidden />
        <span lang={locale} className="min-w-0 flex-1 truncate tracking-tight">
          {triggerLabel}
        </span>
        <SelectValue className="sr-only">{triggerLabel}</SelectValue>
      </SelectTrigger>

      <SelectContent
        align="end"
        sideOffset={10}
        alignItemWithTrigger={false}
        className="border-border/60 min-w-44 rounded-xl p-1.5 shadow-lg ring-1 ring-black/5"
        aria-label={t("menu.language")}
      >
        {sortedLocales.map(({ value, label }) => (
          <SelectItem
            key={value}
            value={value}
            className="rounded-lg py-2.5 pr-9 pl-2.5 **:data-[slot=select-item-text]:whitespace-normal"
          >
            <LocaleMenuLabel
              localeCode={value}
              nativeName={label}
              localizedName={t(`menu.locale-options.${value}`)}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LocaleSelector;
