import type { FC } from "react";

import HeaderArticle from "@/components/shared/header-article";
import { getTranslations } from "next-intl/server";
import SoftSkillSwiper from "./soft-skill-swiper";

const SoftSkills: FC = async () => {
  const t = await getTranslations("main.soft-skills");

  return (
    <section className="hero relative flex h-[55vh] w-full flex-col items-center overflow-hidden md:h-[65vh]">
      <video
        loop
        muted
        autoPlay
        poster="https://res.cloudinary.com/js-media/image/upload/v1642524508/portfolio/hero/1947484_ehwya0.webp"
        className="absolute inset-0 z-[-1] h-screen w-[100vw] object-cover"
      >
        <source
          src="https://res.cloudinary.com/js-media/video/upload/v1743563600/portfolio/hero-soft-skills_wjhagr.webm"
          type="video/webm"
        />
      </video>
      <div className="absolute top-0 left-0 h-screen w-full bg-black/50" />
      <HeaderArticle
        title={t("title")}
        description=""
        subtitle=""
        titleClassName="text-gray-200"
      />
      <div className="text-secondaryText-50 mx-auto flex h-full w-full items-center justify-center gap-6 px-4 py-4 pt-0 lg:container lg:px-20 lg:py-20 lg:pt-5">
        <SoftSkillSwiper />
      </div>
    </section>
  );
};

export default SoftSkills;
