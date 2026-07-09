import type { CSSProperties, FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import SoftSkillsCarousel from "./soft-skills-carousel";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

function backgroundImageStyle(url: string): CSSProperties {
  return { backgroundImage: `url(${url})` };
}

const SoftSkills: FC = async () => {
  const t = await getTranslations("main.soft-skills");
  const locale = await getLocale();

  const data = isLocale(locale)
    ? await api.portfolio.getSoftSkillsPublic({ locale })
    : null;

  const section = data?.section;
  const items = data?.items ?? [];

  return (
    <section className="relative flex min-h-[55vh] w-full flex-col items-center overflow-hidden md:min-h-[65vh]">
      {section?.mediaType === "IMAGE" && section.imageUrl ? (
        <div
          aria-hidden
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={backgroundImageStyle(section.imageUrl)}
        />
      ) : (
        <video
          loop
          muted
          autoPlay
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          poster={section?.posterUrl ?? undefined}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          {section?.videoUrl ? (
            <source src={section.videoUrl} type="video/webm" />
          ) : null}
        </video>
      )}

      <div className="absolute inset-0 z-[1] bg-black/55" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center">
        <HeaderArticle
          title={t("title")}
          description=""
          subtitle=""
          className="w-full"
          titleClassName="text-white"
        />
        <div className="flex w-full flex-1 items-center justify-center">
          <SoftSkillsCarousel items={items} />
        </div>
      </div>
    </section>
  );
};

export default SoftSkills;
