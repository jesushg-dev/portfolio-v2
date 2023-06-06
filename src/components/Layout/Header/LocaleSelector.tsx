import React, { FC, useTransition, useMemo } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next-intl/client';
import { useLocale, useTranslations } from 'next-intl';
import { Select, Option } from '@/components/UI/Select';

import { cdFlagloader } from '@/utils/tools/medialoader';

const locales = [
  { value: 'es', label: 'Español', img: 'spanish_kitwbr.webp' },
  { value: 'en', label: 'English', img: 'english_sdpecu.webp' },
  { value: 'de', label: 'Nederlands', img: 'dutch_khyopk.webp' },
];

interface ILocaleSelectorProps {}

const LocaleSelector: FC<ILocaleSelectorProps> = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('header');
  const [isPending, startTransition] = useTransition();
  const crtLocale = useMemo(() => locales.findIndex((l) => l.value === locale), [locale]);

  const onChangeHandler = (index: number) => {
    const lang = locales[index].value;
    startTransition(() => router.replace(`/${lang}${pathname}`));
  };

  return (
    <>
      <Select
        value={crtLocale}
        onChange={onChangeHandler}
        header={
          <div className="flex cursor-pointer items-center justify-center gap-2 rounded p-2 text-sm shadow-none outline-none ring-0 hover:bg-background-100 hover:text-primary-700 md:font-medium">
            <Image
              width={24}
              height={24}
              loader={cdFlagloader}
              src={locales[crtLocale]?.img ?? ''}
              alt={locales[crtLocale]?.label ?? ''}
            />
            <p className="text-sm text-primaryText-700">{t('menu.language')}</p>
          </div>
        }>
        {locales.map(({ value, label, img }) => (
          <Option key={value} label={label}>
            <div className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-800">
              <Image width={24} height={24} loader={cdFlagloader} src={img} alt={label} />
              <p className="text-sm text-primaryText-700">{label}</p>
            </div>
          </Option>
        ))}
      </Select>
    </>
  );
};

export default LocaleSelector;
