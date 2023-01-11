import React, { FC, useState } from 'react';

import Image from 'next/image';
import { Popover, ArrowContainer } from 'react-tiny-popover';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

import { useRouter } from 'next/router';
import { cdFlagloader } from '../../../utils/tools/medialoader';

interface IToolbarHeaderProps {
  open: boolean;
  toogleOpen: () => void;
}

const languagesOptions = [
  { value: 'es', label: 'Español', img: 'spanish_kitwbr.webp' },
  { value: 'en', label: 'English', img: 'english_sdpecu.webp' },
];

const ToolbarHeader: FC<IToolbarHeaderProps> = ({ toogleOpen, open }) => {
  const { locale, push } = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const crtLocale = languagesOptions.find((l) => l.value === locale);

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
    <div className="flex flex-row-reverse items-center md:order-2 md:flex-row">
      <button
        type="button"
        onClick={toogleOpen}
        data-collapse-toggle="mobile-menu-language-select"
        className="ml-1 inline-flex items-center rounded-lg p-2 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden"
        aria-controls="mobile-menu-language-select"
        aria-expanded={open}>
        <span className="sr-only">Open main menu</span>
        {open ? (
          <RiCloseLine aria-hidden="true" className="h-6 w-6" />
        ) : (
          <RiMenu3Line aria-hidden="true" className="h-6 w-6" />
        )}
      </button>
      <Popover
        padding={5}
        reposition={false}
        isOpen={isPopoverOpen}
        positions={['bottom', 'left']}
        containerClassName="z-50"
        onClickOutside={() => setIsPopoverOpen(false)}
        content={(data) => (
          <ArrowContainer {...data} arrowSize={10} arrowColor={'white'} arrowClassName="shadow-lg">
            <div className="rounded bg-white text-base shadow ">
              <ul className="py-2">
                {languagesOptions.map(({ value, label, img }) => (
                  <li key={value}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={onSubmit.bind(null, value)}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-700 md:text-sm md:font-medium">
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
            className="inline-flex cursor-pointer items-center justify-center rounded p-2 text-sm  hover:bg-gray-100 hover:text-blue-700 md:font-medium">
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
    </div>
  );
};

export default ToolbarHeader;
