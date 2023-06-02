import React, { FC, Fragment, useRef, useTransition, useMemo } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next-intl/client';
import { useLocale, useTranslations } from 'next-intl';

import { Popover, Transition } from '@headlessui/react';

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
  const crtLocale = useMemo(() => locales.find((l) => l.value === locale), [locale]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutDuration = 200;
  let timeout: NodeJS.Timeout;

  const onChangeHandler = (lang: string) => {
    startTransition(() => router.replace(`/${lang}${pathname}`));
  };

  /* const onSubmit = async (lang: string) => {
    await fetch('/api/language', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferredLocale: lang }),
    });

    //push('/', '/', { locale: lang });
  };*/

  const closePopover = () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    return buttonRef.current?.dispatchEvent(event);
  };

  const onMouseEnter = (open: boolean) => {
    clearTimeout(timeout);
    if (open) return;
    return buttonRef.current?.click();
  };

  const onMouseLeave = (open: boolean) => {
    if (!open) return;
    timeout = setTimeout(() => closePopover(), timeoutDuration);
  };

  return (
    <Popover className="relative">
      {({ open }) => {
        return (
          <>
            <div onMouseLeave={onMouseLeave.bind(null, open)}>
              <Popover.Button
                ref={buttonRef}
                className={`
                  ${open ? '' : 'text-opacity-90'}
                  inline-flex cursor-pointer items-center justify-center rounded p-2 text-sm shadow-none outline-none ring-0 hover:bg-background-100 hover:text-primary-700 md:font-medium`}
                onMouseEnter={onMouseEnter.bind(null, open)}
                onMouseLeave={onMouseLeave.bind(null, open)}>
                <div className="flex w-full items-center justify-between">
                  <Image
                    width={24}
                    height={24}
                    loader={cdFlagloader}
                    src={crtLocale?.img ?? ''}
                    alt={crtLocale?.label ?? ''}
                    className="md:mr-2"
                  />
                  <span className="hidden md:block">{t('menu.language')}</span>
                </div>
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1">
                <Popover.Panel className="absolute left-1/2 z-10 mt-0 w-screen max-w-[8.5rem] -translate-x-1/2 transform px-4 sm:px-0">
                  <div
                    className="overflow-hidden rounded-lg bg-background-50 shadow-lg ring-1 ring-black ring-opacity-5"
                    onMouseEnter={onMouseEnter.bind(null, open)}
                    onMouseLeave={onMouseLeave.bind(null, open)}>
                    <ul className="py-2">
                      {locales.map(({ value, label, img }) => (
                        <li key={value}>
                          <button
                            type="button"
                            onClick={onChangeHandler.bind(null, value)}
                            className={`w-full px-4 py-2 text-sm text-primaryText-700 ${
                              value === locale ? 'bg-background-300' : ''
                            }  hover:bg-background-100 hover:text-primary-700 md:text-sm md:font-medium`}>
                            <div className="inline-flex items-center">
                              <Image
                                width={24}
                                className="mr-2"
                                height={24}
                                loader={cdFlagloader}
                                src={img}
                                alt={label}
                              />
                              {label}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Popover.Panel>
              </Transition>
            </div>
          </>
        );
      }}
    </Popover>
  );
};

export default LocaleSelector;
