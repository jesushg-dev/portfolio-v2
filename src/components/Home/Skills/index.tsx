"use client";

import type { FC } from "react";
import React, { useState } from "react";
import dynamic from "next/dynamic";

import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence } from "motion/react";

import { Link } from "@/i18n/routing";
import HeaderArticle from "@/components/shared/header-article";
import type { SkillType, SkillTypeType } from "@/utils/interfaces/types";

import { LoadingFixed } from "@/components/shared/loading";
import SkillsFilterAndGroup from "./SkillsFilterAndGroup";

const SkillModal = dynamic(() => import("./SkillModal"), {
  loading: () => <LoadingFixed />,
});

const BgParticles = dynamic(() => import("./BgParticles"), {
  loading: () => <LoadingFixed />,
});

const Skills: FC = () => {
  const locale = useLocale();

  const t = useTranslations("main.skills");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedSkillType, setSelectedSkillType] =
    useState<SkillTypeType>("FRONTEND");

  const handleOpenModal = (skill: SkillType, type: SkillTypeType) => {
    setSelectedSkillType(type);
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-background-50 relative">
        <article className="mx-auto px-4 pb-4 lg:container lg:px-20 lg:pb-20">
          <BgParticles />
          <HeaderArticle
            showIcon
            title={t("title")}
            subtitle={t("subtitle")}
            description={t("description")}
          />
          <div id="skills" className="z-10 overflow-hidden">
            <SkillsFilterAndGroup
              locale={locale}
              handleOpenModal={handleOpenModal}
            />
            <div className="container mx-auto flex w-full justify-center py-5">
              <Link
                scroll
                href="/certificates"
                className="group text-primary-600 z-30 mt-4 inline-flex items-center gap-1 text-sm font-medium"
              >
                {t("modal.seeCertificates")}
                <span
                  aria-hidden="true"
                  className="block transition group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </article>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedSkill && (
          <SkillModal
            skill={selectedSkill}
            onClose={handleCloseModal}
            type={selectedSkillType}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Skills;
