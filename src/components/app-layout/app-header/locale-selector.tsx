import type { FC } from "react";
import { useTransition, useMemo } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Select, Option } from "@/components/custom-ui/custom-select";
import { usePathname, useRouter } from "@/i18n/routing";
import { appLocales } from "@/i18n/config";
import { cdFlagloader } from "@/utils/tools/image";

const LocaleSelector: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("global.header");

  const [isPending, startTransition] = useTransition();
  const crtLocale = useMemo(
    () => appLocales.findIndex((l) => l.value === locale),
    [locale],
  );

  const onChangeHandler = (index: number) => {
    const nextLocale = appLocales[index].value;
    startTransition(() => {
      // @ts-expect-error - Next-Intl typing for dynamic routes returned by usePathname
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
            src={appLocales[crtLocale]?.img ?? ""}
            alt={appLocales[crtLocale]?.label ?? ""}
          />
          <span className="text-sm">{t("menu.language")}</span>
        </div>
      }
    >
      {appLocales.map(({ value, label, img }) => (
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
