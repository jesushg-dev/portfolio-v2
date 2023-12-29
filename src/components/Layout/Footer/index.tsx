import type { FC } from 'react';
import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FcLike } from 'react-icons/fc';
import { IoMail } from 'react-icons/io5';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { RiPhoneFill, RiWhatsappFill } from 'react-icons/ri';

import { Link } from '@/navigation';
import SpotifyWidget from '@/components/Common/SpotifyWidget';

interface IFooterProps {}

const Footer: FC<IFooterProps> = ({}) => {
  const t = useTranslations('global.footer');

  return (
    <footer className="bg-gray-900 z-10">
      <div className="container mx-auto flex max-w-screen-xl flex-wrap items-center justify-between px-4 sm:px-6 py-10 lg:px-8 lg:pt-20">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
          <div className="col-span-full lg:col-span-1">
            <Link className=" text-xl font-semibold text-white group" href="/" aria-label="Brand">
              Jehg <span className="tracking-relaxed text-secondaryText-500 group-hover:text-white">.</span>
            </Link>
          </div>
          {/* End Col */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-100">{t('titles.portfolio')}</h4>
            <div className="mt-3 grid space-y-3">
              <Link className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200" href="/certificates">
                {t('sections.portfolio.certificates')}
              </Link>
              <Link className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200" href="/curriculum-vitae">
                {t('sections.portfolio.curriculum')}
              </Link>
            </div>
          </div>
          {/* End Col */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-100">{t('titles.miscellaneous')}</h4>
            <div className="mt-3 grid space-y-3">
              <div className="flex items-center gap-2">
                <p className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200">
                  {t('sections.miscellaneous.opSysCv')}
                </p>
                <span className="inline ml-1 text-xs bg-primary-700 text-white py-1 px-2 rounded-md">{t('soon')}</span>
              </div>
            </div>
          </div>
          {/* End Col */}
          <div className="col-span-2">
            <h4 className="font-semibold text-gray-100">{t('titles.NowPlaying')}</h4>
            <div className="mt-4 w-full flex rounded-md p-2 bg-gray-800">
              <SpotifyWidget />
            </div>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs gap-2 mt-2 ml-3"
              href="https://developer.spotify.com/documentation/web-api">
              <span className=" text-gray-400 text-sm">{t('spotify.poweredBy')}</span>
              <Image
                src="https://res.cloudinary.com/js-media/image/upload/v1691956781/portfolio/win11/Spotify_Logo_RGB_Green_a3ceey.webp"
                alt="Spotify"
                width={60}
                height={1}
              />
            </a>
          </div>
          {/* End Col */}
        </div>
        {/* End Grid */}
        <div className="mt-5 sm:mt-7 grid gap-y-2 sm:gap-y-0 sm:flex sm:justify-between sm:items-center w-full">
          <div className="gap-1 flex flex-col justify-start items-start">
            <p className="text-sm text-gray-400 flex items-center">
              {t('madeWith')} <FcLike className="mx-auto md:mx-1" /> {t('by')} Jesús Hernández
            </p>
            <p className="text-xs text-gray-400 flex items-center">
              {t('title')}
              {Date().split(' ')[3]}
            </p>
          </div>

          {/* End Col */}
          {/* Social Brands */}
          <div>
            <a
              href="https://linkedin.com/in/jesus-hernandez23"
              className="inline-flex justify-center items-center gap-x-3.5 w-10 h-10 text-center text-gray-200 hover:bg-white/[.1] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition">
              <FaLinkedinIn className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/jess232017"
              className="inline-flex justify-center items-center gap-x-3.5 w-10 h-10 text-center text-gray-200 hover:bg-white/[.1] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition">
              <FaGithub className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/+50586793204"
              className="inline-flex justify-center items-center gap-x-3.5 w-10 h-10 text-center text-gray-200 hover:bg-white/[.1] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition">
              <RiWhatsappFill className="w-5 h-5" />
            </a>
            <a
              href="tel:86793204"
              className="inline-flex justify-center items-center gap-x-3.5 w-10 h-10 text-center text-gray-200 hover:bg-white/[.1] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition">
              <RiPhoneFill className="w-5 h-5" />
            </a>
            <a
              href="mailto:jess232016@gmail.com"
              className="inline-flex justify-center items-center gap-x-3.5 w-10 h-10 text-center text-gray-200 hover:bg-white/[.1] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition">
              <IoMail className="w-5 h-5" />
            </a>
          </div>
          {/* End Social Brands */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
