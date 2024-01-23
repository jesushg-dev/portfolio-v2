import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "@/navigation";

import Modal, { CloseModal } from "../../UI/Modal";
import { siLoader } from "../../../utils/tools/medialoader";
import type { SkillType } from "../../../utils/interfaces/types";

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
          <div className="mb-16 mt-12 flex flex-col items-start text-left md:mb-0 lg:w-1/2 lg:flex-grow lg:pl-6 xl:mt-0 xl:pl-12">
            <span className="mb-8 text-xs font-bold uppercase tracking-widest text-primary-600">
              {type}
            </span>
            <motion.h1 className="mb-8 text-4xl font-bold leading-none tracking-tighter text-primaryText-50 md:text-7xl lg:text-5xl">
              {skill.title}
            </motion.h1>
            <p className="mb-8 text-left text-base leading-relaxed text-primaryText-500">
              {skill.description}
            </p>
            <div className="mt-0 w-full sm:flex lg:mt-6">
              <div className="mt-3 rounded-lg sm:mt-0">
                <Link
                  href="/certificates"
                  className="pressable block transform items-center rounded-xl bg-primary-600 px-3.5 py-4 text-center text-base font-medium text-secondaryText-50 transition duration-500 ease-in-out hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {t("modal.seeCertificates")}
                </Link>
              </div>
              <div className="mt-3 rounded-lg sm:ml-3 sm:mt-0">
                <a
                  href={skill.urlWiki}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable block transform items-center rounded-xl border-2 border-secondaryText-500 px-3.5 py-3.5 text-center text-base font-medium text-primary-600 shadow-md transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-background-500 focus:ring-offset-2"
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
