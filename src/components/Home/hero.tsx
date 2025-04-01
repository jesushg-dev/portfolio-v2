import type { FC } from "react";
import { FaDownload } from "react-icons/fa";

import { Link } from "@/i18n/routing";
import HeroWriter from "./hero-writer";
import { getTranslations } from "next-intl/server";

const Contact: FC = async () => {
  const t = await getTranslations("main.heroMain");

  return (
    <section
      id="home"
      className="hero text-secondaryText-50 before:bg-hero-main relative flex min-h-screen w-full overflow-hidden bg-black"
    >
      <div className="z-10 mx-auto flex w-full flex-col items-start justify-center gap-2 px-4 py-8 pt-28 lg:container lg:px-10 lg:py-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="order-1 flex w-full justify-center lg:order-2 lg:w-2/5 lg:justify-end">
            <div className="circle-img overflow-hidden transition-all ease-in-out hover:scale-105" />
          </div>
          <div className="order-2 flex w-full flex-col items-center justify-center gap-4 lg:order-1 lg:w-3/5 lg:items-start lg:justify-start">
            <h1 className="text-center text-4xl font-semibold text-white antialiased lg:text-start">
              {t("greeting")} <br className="md:hidden" />{" "}
              <strong className="text-primary-500">Jesús Hernández</strong>
            </h1>
            <div className="flex justify-center text-2xl text-white lg:justify-start">
              <HeroWriter />
            </div>
            <div className="rounded-md p-4 backdrop-blur-2xl lg:p-0 lg:backdrop-blur-none">
              <p className="text-center text-base font-normal text-gray-300 lg:text-start">
                {t("description")}
              </p>
            </div>
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

export default Contact;
