import type { CSSProperties, FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";

import { FaDownload } from "react-icons/fa";

import { Link } from "@/i18n/routing";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import HeroWriter from "./hero-writer";

const DEFAULT_PHOTO =
  "https://res.cloudinary.com/js-media/image/upload/v1750355900/portfolio/carnet/uefv0bzpwxnlrrniisba.webp";

const DEFAULT_BACKGROUND =
  "https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3233453_brzqcm.webp";

function heroBackgroundStyle(url: string): CSSProperties {
  // Unquoted url() — quoted values in CSS vars break when serialized as &quot; in HTML.
  return { backgroundImage: `url(${url})` };
}

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Hero: FC = async () => {
  const t = await getTranslations("main.heroMain");
  const locale = await getLocale();
  const heroData = isLocale(locale)
    ? await api.portfolio.getHeroPublic({ locale })
    : null;

  const fullName = heroData?.fullName ?? "";
  const photoUrl = heroData?.photoUrl ?? DEFAULT_PHOTO;
  const backgroundUrl = heroData?.backgroundImageUrl ?? DEFAULT_BACKGROUND;
  const heroSummary = heroData?.heroSummary ?? "";
  const imageAlt = (heroData?.imageAlt ?? fullName) || "profile";
  const titles = heroData?.titles ?? [];

  return (
    <section
      id="home"
      className="text-secondaryText-50 relative flex min-h-screen w-full overflow-hidden bg-black"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat brightness-75 md:bg-center lg:bg-fixed"
        style={heroBackgroundStyle(backgroundUrl)}
      />
      <div className="z-10 mx-auto flex w-full flex-col items-start justify-center gap-2 px-4 py-8 pt-28 lg:container lg:px-10 lg:py-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="order-1 flex w-full justify-center lg:order-2 lg:w-2/5 lg:justify-end">
            <div className="bg-primary-500 relative h-44 w-44 overflow-hidden rounded-full p-2 lg:h-72 lg:w-72">
              <Image
                width={300}
                height={300}
                src={photoUrl}
                alt={imageAlt}
                className="absolute top-0 left-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover"
              />
            </div>
          </div>
          <div className="order-2 flex w-full flex-col items-center justify-center gap-4 lg:order-1 lg:w-3/5 lg:items-start lg:justify-start">
            {fullName ? (
              <h1 className="text-center text-4xl font-semibold text-white antialiased lg:text-start">
                {t("greeting")} <br className="md:hidden" />{" "}
                <strong className="text-primary-500">{fullName}</strong>
              </h1>
            ) : (
              <h1 className="text-center text-4xl font-semibold text-white antialiased lg:text-start">
                {t("greeting")}
              </h1>
            )}
            {titles.length > 0 ? (
              <div className="flex justify-center text-2xl text-white lg:justify-start">
                <HeroWriter titles={titles} />
              </div>
            ) : null}
            {heroSummary ? (
              <div className="rounded-md p-4 backdrop-blur-2xl lg:p-0 lg:backdrop-blur-none">
                <p className="text-center text-base font-normal text-gray-300 lg:text-start">
                  {heroSummary}
                </p>
              </div>
            ) : null}
            <span className="relative inline-flex">
              <Link
                href="/curriculum-vitae"
                className="pressable bg-primary-700 hover:bg-primary-800 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg"
              >
                {t("viewCV")} <FaDownload className="text-xs" />
              </Link>
              <span className="absolute top-0 right-0 -mt-0 -mr-1 flex h-3 w-3">
                <span className="bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-primary-500 relative inline-flex h-3 w-3 rounded-full" />
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 mx-auto hidden flex-col items-center justify-center gap-2 lg:flex">
        <div className="scroll-indicator" />
        <p className="text-xs text-neutral-500">{t("scrollDown")}</p>
      </div>
    </section>
  );
};

export default Hero;
