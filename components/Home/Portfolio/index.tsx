import React, { FC, useRef, useMemo } from 'react';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

import PortfolioItem from '../ProjectItem';
import { IProject } from '../../../utils/interfaces/portfolio';

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
    <main className="mx-auto px-4 py-4 lg:container lg:px-20 lg:py-20">
      <div className="flex flex-col items-center justify-between border-b border-gray-200 py-6 lg:flex-row lg:justify-between">
        <h2 className="font-bold text-blue-600">{t('title')}</h2>
        <span className="text-sm text-gray-800">{t('subtitle')}</span>
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
    </main>
  );
};

export default Portfolio;
