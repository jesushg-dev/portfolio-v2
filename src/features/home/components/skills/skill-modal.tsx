"use client";

import type { FC } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import Modal, { CloseModal } from "@/components/custom-ui/custom-modal";

import { SkillDetailView } from "./skill-detail-view";
import { SKILL_MODAL_SIZE_CLASS } from "./skill-modal.constants";
import type { SkillDetailType } from "@/utils/interfaces/types";

interface SkillModalProps {
  skillSlug: string;
  onClose: () => void;
  initialData: SkillDetailType;
}

const SkillModal: FC<SkillModalProps> = ({
  skillSlug,
  onClose,
  initialData,
}) => {
  const t = useTranslations("main.skills");

  return (
    <Modal
      onClickBackdrop={onClose}
      className={`${SKILL_MODAL_SIZE_CLASS} border-border/40 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-2xl`}
    >
      <motion.section className="relative flex min-h-0 flex-col overflow-hidden px-6 pt-6 pb-4 sm:px-7">
        <CloseModal onClick={onClose} title={t("modal.close")} />
        <SkillDetailView skillSlug={skillSlug} initialData={initialData} />
      </motion.section>
    </Modal>
  );
};

export default SkillModal;
