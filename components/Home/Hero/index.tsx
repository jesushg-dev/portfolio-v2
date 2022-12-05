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
    <div className="main-hero container mx-auto flex h-screen w-full flex-col items-center justify-center gap-10 px-4 text-white before:brightness-75">
      <h1 className="z-10 text-center text-5xl font-extrabold antialiased">Jesús Hernández</h1>
      <div className="z-10 text-white">
        <Typewriter options={options} />
      </div>
      <div className="absolute bottom-4 flex flex-col items-center justify-center gap-2 ">
        <span className="icon-scroll"></span>
        <p className="text-xs text-neutral-500">{t('scrollDown')}</p>
      </div>
    </div>
  );
};

export default Hero;
