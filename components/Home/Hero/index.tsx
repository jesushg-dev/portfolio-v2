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
    <div className="main-hero h-screen w-full before:brightness-75 container mx-auto px-4 flex flex-col justify-center items-center gap-10 text-white">
      <h1 className="text-5xl font-extrabold z-10 antialiased text-center">Jesús Hernández</h1>
      <div className="text-white z-10">
        <Typewriter options={options} />
      </div>
      <div className="absolute bottom-4 gap-2 flex flex-col items-center justify-center ">
        <span className="icon-scroll"></span>
        <p className="text-neutral-500 text-xs">{t('scrollDown')}</p>
      </div>
    </div>
  );
};

export default Hero;
