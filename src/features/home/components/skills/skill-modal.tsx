"use client";

import type { FC } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import Modal, { CloseModal } from "@/components/custom-ui/custom-modal";

import { SkillDetailView } from "./skill-detail-view";

interface SkillModalProps {
  skillSlug: string;
  onClose: () => void;
}

const SkillModal: FC<SkillModalProps> = ({ skillSlug, onClose }) => {
  const t = useTranslations("main.skills");

  return (
    <Modal
      onClickBackdrop={onClose}
      className="border-0 md:max-h-[min(90vh,40rem)] md:w-11/12 md:overflow-hidden lg:max-w-2xl"
    >
      <motion.section className="relative flex max-h-[min(90vh,40rem)] flex-col px-6 py-6 sm:px-8">
        <CloseModal onClick={onClose} title={t("modal.close")} />
        <SkillDetailView skillSlug={skillSlug} compact />
      </motion.section>
    </Modal>
  );
};

export default SkillModal;
