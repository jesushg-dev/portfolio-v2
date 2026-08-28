"use client";

import type { FC } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import Modal, { CloseModal } from "@/components/custom-ui/custom-modal";

import { SkillDetailView } from "./skill-detail-view";
import { SKILL_MODAL_SIZE_CLASS } from "./skill-modal.constants";

interface SkillModalProps {
  skillSlug: string;
  onClose: () => void;
}

const SkillModal: FC<SkillModalProps> = ({ skillSlug, onClose }) => {
  const t = useTranslations("main.skills");

  return (
    <Modal
      onClickBackdrop={onClose}
      className={`${SKILL_MODAL_SIZE_CLASS} flex w-full flex-col overflow-hidden border-0 md:w-11/12 lg:max-w-2xl`}
    >
      <motion.section className="relative flex h-full min-h-0 flex-col overflow-hidden px-6 pt-6 pb-4 sm:px-8">
        <CloseModal onClick={onClose} title={t("modal.close")} />
        <SkillDetailView skillSlug={skillSlug} compact />
      </motion.section>
    </Modal>
  );
};

export default SkillModal;
