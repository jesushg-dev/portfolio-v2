import React, { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Typewriter from 'typewriter-effect';

interface IHeroProps {}

const Hero: FC<IHeroProps> = ({}) => {
  const t = useTranslations('heroMain');
  const options = useMemo(() => {
    const strings = [
      t('titles.degree'),
      t('titles.web'),
      t('titles.mobile'),
      t('titles.fullstack'),
      t('titles.frontend'),
      t('titles.backend'),
    ];

    return {
      strings,
      loop: true,
      autoStart: true,
      wrapperClassName: 'text-2xl Typewriter__wrapper',
      cursorClassName: 'text-2xl Typewriter__cursor',
    };
  }, [t]);

  return (
    <div className="hero flex h-screen w-full flex-col items-center justify-center gap-10 bg-black px-4 text-white before:h-screen before:bg-hero-main">
      <h1 className="z-10 text-center text-5xl font-extrabold antialiased">Jesús Hernández</h1>
      <div className="z-10 text-white">
        <Typewriter options={options} />
      </div>
      <div className="absolute bottom-4 flex flex-col items-center justify-center gap-2 ">
        <span className="icon-scroll h-8 w-5 rounded-3xl"></span>
        <p className="text-xs text-neutral-500">{t('scrollDown')}</p>
      </div>
    </div>
  );
};

export default Hero;
