import React, { FC, useState, memo } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/router';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { cdFlagloader } from '../../../utils/tools/medialoader';

const languagesOptions = [
  { value: 'es', label: 'Español', img: 'spanish_kitwbr.webp' },
  { value: 'en', label: 'English', img: 'english_sdpecu.webp' },
];

interface ILanguageSelectorProps {}

const LanguageSelector: FC<ILanguageSelectorProps> = ({}) => {
  const { locale, push } = useRouter();
  const crtLocale = languagesOptions.find((l) => l.value === locale);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onSubmit = async (lang: string) => {
    await fetch('/api/language', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferredLocale: lang }),
    });

    setIsPopoverOpen(false);
    push('/', '/', { locale: lang });
  };

  return (
    <Popover
      padding={5}
      reposition={false}
      isOpen={isPopoverOpen}
      positions={['bottom', 'left']}
      containerClassName="z-50"
      onClickOutside={() => setIsPopoverOpen(false)}
      content={(data) => (
        <ArrowContainer {...data} arrowSize={10} arrowColor={'white'} arrowClassName="shadow-lg">
          <div className="rounded bg-background-50 text-base shadow ">
            <ul className="py-2">
              {languagesOptions.map(({ value, label, img }) => (
                <li key={value}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onSubmit.bind(null, value)}
                    className="w-full px-4 py-2 text-sm text-primaryText-700 hover:bg-background-100 hover:text-primary-700 md:text-sm md:font-medium">
                    <div className="inline-flex items-center">
                      <Image width={24} className="mr-2" height={24} loader={cdFlagloader} src={img} alt={label} />
                      {label}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ArrowContainer>
      )}>
      <div>
        <button
          type="button"
          data-dropdown-toggle="language-dropdown-menu"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="inline-flex cursor-pointer items-center justify-center rounded p-2 text-sm  hover:bg-background-100 hover:text-primary-700 md:font-medium">
          <div className="inline-flex items-center">
            <Image
              width={24}
              height={24}
              loader={cdFlagloader}
              src={crtLocale?.img ?? ''}
              alt={crtLocale?.label ?? ''}
              className="md:mr-2"
            />
            <span className="hidden md:block">{crtLocale?.label ?? ''}</span>
          </div>
        </button>
      </div>
    </Popover>
  );
};

const areEqual = (prevProps: ILanguageSelectorProps, nextProps: ILanguageSelectorProps) => {
  return true;
};

export default memo(LanguageSelector, areEqual);
