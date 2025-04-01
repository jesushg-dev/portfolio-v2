import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

import Modal, { CloseModal } from "../../custom-ui/Modal";
import type { SkillType } from "../../../utils/interfaces/types";
import { siLoader } from "@/utils/tools/image";

interface ISkillModalProps {
  type: string;
  skill: SkillType;
  onClose: () => void;
}
const SkillModal: FC<ISkillModalProps> = ({ skill, type, onClose }) => {
  const t = useTranslations("main.skills");

  return (
    <Modal onClickBackdrop={onClose}>
      <motion.section
        layoutId={skill.id}
        className="relative mx-auto max-w-7xl px-12 py-12"
      >
        <CloseModal onClick={onClose} title={t("modal.close")} />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center">
          <div className="w-full rounded-xl lg:w-1/2 lg:max-w-lg">
            <div>
              <div className="relative w-full max-w-lg">
                <div className="animate-blob absolute top-0 left-14 h-36 w-36 rounded-full bg-violet-300 opacity-70 mix-blend-multiply blur-xl filter" />
                <div className="animate-blob animation-delay-4000 absolute right-16 -bottom-12 h-36 w-36 rounded-full bg-fuchsia-300 opacity-70 mix-blend-multiply blur-xl filter" />
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
          <div className="mt-12 mb-16 flex flex-col items-start text-left md:mb-0 lg:w-1/2 lg:grow lg:pl-6 xl:mt-0 xl:pl-12">
            <span className="text-primary-600 mb-8 text-xs font-bold tracking-widest uppercase">
              {type}
            </span>
            <motion.h1 className="text-primaryText-50 mb-8 text-4xl leading-none font-bold tracking-tighter md:text-7xl lg:text-5xl">
              {skill.title}
            </motion.h1>
            <p className="text-primaryText-500 mb-8 text-left text-base leading-relaxed">
              {skill.description}
            </p>
            <div className="mt-0 w-full sm:flex lg:mt-6">
              <div className="mt-3 rounded-lg sm:mt-0">
                <Link
                  href="/certificates"
                  className="pressable bg-primary-600 text-secondaryText-50 hover:bg-primary-700 focus:ring-primary-500 block transform items-center rounded-xl px-3.5 py-4 text-center text-base font-medium transition duration-500 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                >
                  {t("modal.seeCertificates")}
                </Link>
              </div>
              <div className="mt-3 rounded-lg sm:mt-0 sm:ml-3">
                <a
                  href={skill.urlWiki}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable border-secondaryText-500 text-primary-600 focus:ring-background-500 block transform items-center rounded-xl border-2 px-3.5 py-3.5 text-center text-base font-medium shadow-md transition duration-500 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                >
                  {t("modal.readMore")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </Modal>
  );
};

export default SkillModal;
