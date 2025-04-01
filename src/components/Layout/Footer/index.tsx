import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FcLike } from "react-icons/fc";
import { IoMail } from "react-icons/io5";
import { FaLinkedinIn, FaGithub } from "react-icons/fa";
import { RiPhoneFill, RiWhatsappFill } from "react-icons/ri";

import { Link } from "@/i18n/routing";
import SpotifyWidget from "@/components/shared/SpotifyWidget";

const Footer: FC = () => {
  const t = useTranslations("global.footer");

  return (
    <footer className="z-10 bg-gray-900">
      <div className="container mx-auto flex max-w-(--breakpoint-xl) flex-wrap items-center justify-between px-4 py-10 sm:px-6 lg:px-8 lg:pt-20">
        {/* Grid */}
        <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-full lg:col-span-1">
            <Link
              className="group text-xl font-semibold text-white"
              href="/"
              aria-label="Brand"
            >
              Jehg{" "}
              <span className="tracking-relaxed text-secondaryText-500 group-hover:text-white">
                .
              </span>
            </Link>
          </div>
          {/* End Col */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-100">
              {t("titles.portfolio")}
            </h4>
            <div className="mt-3 grid space-y-3">
              <Link
                className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200"
                href="/certificates"
              >
                {t("sections.portfolio.certificates")}
              </Link>
              <Link
                className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200"
                href="/curriculum-vitae"
              >
                {t("sections.portfolio.curriculum")}
              </Link>
            </div>
          </div>
          {/* End Col */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-100">
              {t("titles.miscellaneous")}
            </h4>
            <div className="mt-3 grid space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex gap-x-2 text-gray-400">
                  {t("sections.miscellaneous.opSysCv")}
                </span>
                <span className="bg-primary-700 ml-1 inline rounded-md px-2 py-1 text-xs text-white">
                  {t("soon")}
                </span>
              </div>
            </div>
          </div>
          {/* End Col */}
          <div className="col-span-2">
            <h4 className="font-semibold text-gray-100">
              {t("titles.NowPlaying")}
            </h4>
            <div className="mt-4 flex w-full rounded-md bg-gray-800 p-2">
              <SpotifyWidget />
            </div>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 ml-3 flex items-center gap-2 text-xs"
              href="https://developer.spotify.com/documentation/web-api"
            >
              <span className="text-sm text-gray-400">
                {t("spotify.poweredBy")}
              </span>
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
        <div className="mt-5 grid w-full gap-y-2 sm:mt-7 sm:flex sm:items-center sm:justify-between sm:gap-y-0">
          <div className="flex flex-col items-start justify-start gap-1">
            <p className="flex items-center text-sm text-gray-400">
              {t("madeWith")} <FcLike className="mx-auto md:mx-1" /> {t("by")}{" "}
              Jesús Hernández
            </p>
            <p className="flex items-center text-xs text-gray-400">
              {t("title")}
              {Date().split(" ")[3]}
            </p>
          </div>

          {/* End Col */}
          {/* Social Brands */}
          <div>
            <a
              href="https://linkedin.com/in/jesus-hernandez23"
              className="inline-flex h-10 w-10 items-center justify-center gap-x-3.5 rounded-md text-center text-gray-200 transition hover:bg-white/[.1] focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-hidden"
            >
              <FaLinkedinIn className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/jess232017"
              className="inline-flex h-10 w-10 items-center justify-center gap-x-3.5 rounded-md text-center text-gray-200 transition hover:bg-white/[.1] focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-hidden"
            >
              <FaGithub className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/+50586793204"
              className="inline-flex h-10 w-10 items-center justify-center gap-x-3.5 rounded-md text-center text-gray-200 transition hover:bg-white/[.1] focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-hidden"
            >
              <RiWhatsappFill className="h-5 w-5" />
            </a>
            <a
              href="tel:86793204"
              className="inline-flex h-10 w-10 items-center justify-center gap-x-3.5 rounded-md text-center text-gray-200 transition hover:bg-white/[.1] focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-hidden"
            >
              <RiPhoneFill className="h-5 w-5" />
            </a>
            <a
              href="mailto:jess232016@gmail.com"
              className="inline-flex h-10 w-10 items-center justify-center gap-x-3.5 rounded-md text-center text-gray-200 transition hover:bg-white/[.1] focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-hidden"
            >
              <IoMail className="h-5 w-5" />
            </a>
          </div>
          {/* End Social Brands */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
