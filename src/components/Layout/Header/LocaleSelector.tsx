import type { FC } from "react";
import React, { useTransition, useMemo } from "react";
import Image from "next/image";
import { type Locale, useLocale, useTranslations } from "next-intl";

import { Select, Option } from "@/components/custom-ui/Select";
import { usePathname, useRouter } from "@/i18n/routing";
import { cdFlagloader } from "@/utils/tools/image";

const locales = [
  {
    value: "es",
    label: "Español",
    img: "spanish_flag_k7ij7d.webp",
  },
  {
    value: "en",
    label: "English",
    img: "english_flag_xeqq0r.webp",
  },
  {
    value: "nl",
    label: "Nederlands",
    img: "dutch_flag_lv5lyh.webp",
  },
] satisfies {
  value: Locale;
  label: string;
  img: string;
}[];

const LocaleSelector: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("global.header");

  const [isPending, startTransition] = useTransition();
  const crtLocale = useMemo(
    () => locales.findIndex((l) => l.value === locale),
    [locale],
  );

  const onChangeHandler = (index: number) => {
    const nextLocale = locales[index].value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
      router.refresh();
    });
  };

  return (
    <Select
      value={crtLocale}
      disabled={isPending}
      onChange={onChangeHandler}
      header={
        <div className="hover:bg-background-100 hover:text-primary-700 flex cursor-pointer items-center justify-center gap-2 rounded-sm p-2 text-sm shadow-none ring-0 outline-hidden md:font-medium">
          <Image
            width={24}
            height={24}
            loader={cdFlagloader}
            src={locales[crtLocale]?.img ?? ""}
            alt={locales[crtLocale]?.label ?? ""}
          />
          <span className="text-sm">{t("menu.language")}</span>
        </div>
      }
    >
      {locales.map(({ value, label, img }) => (
        <Option key={value} label={label}>
          <div className="hover:bg-background-400 flex w-full items-center gap-2 px-4 py-2">
            <Image
              width={24}
              height={24}
              loader={cdFlagloader}
              src={img}
              alt={label}
            />
            <p className="text-primaryText-700 text-sm">{label}</p>
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default LocaleSelector;
