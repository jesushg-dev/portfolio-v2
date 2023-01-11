import React, { FC } from 'react';

import Image from 'next/image';
import Modal, { CloseModal } from '../../UI/Modal';

import { siLoader } from '../../../utils/tools/medialoader';
import { useTranslations } from 'next-intl';

import type { ISkill } from '../../../utils/interfaces/portfolio';

interface ISkillModalProps {
  type: string;
  skill: ISkill;
  onClose: () => void;
}

const SkillModal: FC<ISkillModalProps> = ({ skill, type, onClose }) => {
  const t = useTranslations('skills');

  return (
    <Modal onClickBackdrop={onClose}>
      <section className="relative mx-auto max-w-7xl py-12 px-12">
        <CloseModal onClick={onClose} title={t('modal.close')} />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center">
          <div className="w-full rounded-xl lg:w-1/2 lg:max-w-lg">
            <div>
              <div className="relative w-full max-w-lg">
                <div className="animate-blob absolute left-14 top-0 h-36 w-36 rounded-full bg-violet-300 opacity-70 mix-blend-multiply blur-xl filter" />
                <div className="animate-blob animation-delay-4000 absolute -bottom-12 right-16 h-36 w-36 rounded-full bg-fuchsia-300 opacity-70 mix-blend-multiply blur-xl filter" />
                <div className="relative">
                  <Image
                    alt="hero"
                    width={180}
                    height={180}
                    src={skill.image}
                    loader={siLoader}
                    className="mx-auto rounded-lg object-cover object-center shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 mb-16 flex flex-col items-start text-left md:mb-0 lg:w-1/2 lg:flex-grow lg:pl-6 xl:mt-0 xl:pl-12">
            <span className="mb-8 text-xs font-bold uppercase tracking-widest text-blue-600">{type}</span>
            <h1 className="mb-8 text-4xl font-bold leading-none tracking-tighter text-neutral-600 md:text-7xl lg:text-5xl">
              {skill.title}
            </h1>
            <p className="mb-8 text-left text-base leading-relaxed text-gray-500">{skill.description}</p>
            <div className="mt-0 w-full sm:flex lg:mt-6">
              <div className="mt-3 rounded-lg sm:mt-0">
                <a
                  href="https://platzi.com/p/jess232022/"
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={skill.wiki === ''}
                  className="pressable block transform items-center rounded-xl bg-blue-600 px-3.5 py-4 text-center text-base font-medium text-white transition duration-500 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  {t('modal.seeCertificates')}
                </a>
              </div>
              <div className="mt-3 rounded-lg sm:mt-0 sm:ml-3">
                <a
                  href={skill.wiki}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable block transform items-center rounded-xl border-2 border-white px-3.5 py-3.5 text-center text-base font-medium text-blue-600 shadow-md transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  {t('modal.readMore')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Modal>
  );
};

export default SkillModal;
