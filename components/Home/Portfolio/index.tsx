import React, { FC, useRef, useMemo } from 'react';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

import PortfolioItem from '../ProjectItem';
import type { IProject } from '../../../utils/interfaces/portfolio';

interface IPortfolioProps {
  portfolio: IProject[];
}

const container = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const Portfolio: FC<IPortfolioProps> = ({ portfolio }) => {
  const ref = useRef(null);

  const t = useTranslations('portfolio');
  const isInView = useInView(ref, { once: true });
  const labels = useMemo(
    () => ({
      urlName: t('actions.view'),
      sourceName: t('actions.source'),
      privateName: t('private.title'),
      privateDescription: t('private.description'),
    }),
    [t]
  );

  return (
    <section id="portfolio" className="mx-auto px-4 py-4 lg:container lg:px-20 lg:py-20">
      <div className="container mx-auto">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto mb-[60px] max-w-[510px] text-center">
              <span className="text-primary mb-2 block text-lg font-semibold text-blue-700">{t('subtitle')}</span>
              <h2 className="text-dark mb-4 text-3xl font-bold sm:text-4xl md:text-[40px]">{t('title')}</h2>
              <p className="text-body-color text-base">{t('description')}</p>
            </div>
          </div>
        </div>
      </div>
      <section className="mt-8" ref={ref}>
        <motion.ul
          initial="hidden"
          variants={container}
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {portfolio.map((project) => (
            <motion.li
              layout
              key={project.id}
              className="flex"
              variants={item}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}>
              <PortfolioItem {...project} {...labels} />
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </section>
  );
};

export default Portfolio;
