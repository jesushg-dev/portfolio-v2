"use client";

import { useMemo, type FC } from "react";

import Image from "next/image";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import {
  MdCalendarMonth,
  MdOpenInNew,
  MdSchool,
  MdWorkOutline,
} from "react-icons/md";
import { AiFillGithub, AiFillEye } from "react-icons/ai";

import { api } from "@/trpc/react";
import { formatIssuedDate } from "@/components/certification/format-issued-date";
import type { SkillDetailType } from "@/utils/interfaces/types";
import { siLoader } from "@/utils/tools/image";

import { SkillModalTabs, type SkillModalTab } from "./skill-modal-tabs";

interface SkillDetailViewProps {
  skillSlug: string;
  compact?: boolean;
}

function formatStackType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export const SkillDetailView: FC<SkillDetailViewProps> = ({
  skillSlug,
  compact = false,
}) => {
  const locale = useLocale();
  const t = useTranslations("main.skills");

  const {
    data: detail,
    isLoading,
    isError,
  } = api.portfolio.getSkillDetail.useQuery(
    { slug: skillSlug, locale },
    { enabled: Boolean(skillSlug) },
  );

  const { certificates, experiences, projects } = useMemo(
    (): {
      certificates: SkillDetailType["certificates"];
      experiences: SkillDetailType["experiences"];
      projects: SkillDetailType["projects"];
    } => ({
      certificates: detail?.certificates ?? [],
      experiences: detail?.experiences ?? [],
      projects: detail?.projects ?? [],
    }),
    [detail],
  );

  const tabs = useMemo((): SkillModalTab[] => {
    const items: SkillModalTab[] = [];

    if (experiences.length > 0) {
      items.push({
        id: "experiences",
        label: t("modal.tabExperiences"),
        count: experiences.length,
        content: <ExperienceList experiences={experiences} />,
      });
    }

    if (certificates.length > 0) {
      items.push({
        id: "certificates",
        label: t("modal.tabCertificates"),
        count: certificates.length,
        content: (
          <CertificateList
            certificates={certificates}
            viewLabel={t("modal.viewCertificate")}
          />
        ),
      });
    }

    if (projects.length > 0) {
      items.push({
        id: "projects",
        label: t("modal.tabProjects"),
        count: projects.length,
        content: (
          <ProjectList
            projects={projects}
            viewProjectLabel={t("modal.viewProject")}
            viewSourceLabel={t("modal.viewSource")}
          />
        ),
      });
    }

    return items;
  }, [certificates, experiences, projects, t]);

  const hasRelated = tabs.length > 0;

  return (
    <div
      className={
        compact ? "flex min-h-0 flex-1 flex-col" : "mx-auto w-full max-w-5xl"
      }
    >
      <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative mx-auto w-full max-w-[6.5rem] shrink-0 sm:mx-0">
          <div className="bg-primary-300/30 animate-blob absolute -top-3 left-1 h-20 w-20 rounded-full opacity-70 mix-blend-multiply blur-xl filter" />
          <div className="bg-primary-500/25 animate-blob animation-delay-4000 absolute -right-1 -bottom-4 h-20 w-20 rounded-full opacity-70 mix-blend-multiply blur-xl filter" />
          <div className="bg-background-100 relative mx-auto flex h-24 w-24 items-center justify-center rounded-xl shadow-lg">
            {detail?.image ? (
              <Image
                alt=""
                width={56}
                height={56}
                src={detail.image}
                loader={siLoader}
                className="h-14 w-14 object-contain"
              />
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-left">
          <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
            {formatStackType(detail?.type ?? "SKILL")}
          </span>
          <motion.h2 className="text-primaryText-500 mt-1.5 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            {detail?.title ?? t("subtitle")}
          </motion.h2>
          <p className="text-primaryText-700 mt-2 text-sm leading-relaxed sm:text-base">
            {detail?.description ?? ""}
          </p>
        </div>
      </div>

      <div className={compact ? "min-h-0 flex-1" : "mt-8"}>
        {isLoading ? (
          <SkillModalLoading />
        ) : isError || detail === null ? (
          <p className="text-primaryText-700 mt-6 text-center text-sm">
            {t("modal.loadError")}
          </p>
        ) : hasRelated ? (
          compact ? (
            <SkillModalTabs key={skillSlug} tabs={tabs} />
          ) : (
            <div className="mt-8 space-y-6">
              {tabs.map((tab) => (
                <section key={tab.id} className="space-y-2.5">
                  <h3 className="text-primaryText-500 text-xs font-semibold tracking-widest uppercase">
                    {tab.label}
                  </h3>
                  {tab.content}
                </section>
              ))}
            </div>
          )
        ) : (
          <p className="text-primaryText-700 mt-6 text-center text-sm">
            {t("modal.noRelatedContent")}
          </p>
        )}
      </div>

      {detail && compact ? (
        <div className="mt-5 flex shrink-0 flex-wrap items-center justify-end gap-10">
          {detail.urlWiki ? (
            <a
              href={detail.urlWiki}
              target="_blank"
              rel="noreferrer"
              className="pressable text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 text-sm font-medium transition"
            >
              {t("modal.readMore")}
              <MdOpenInNew className="h-4 w-4" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="pressable bg-primary-600 text-secondaryText-50 hover:bg-primary-700 focus:ring-primary-500 rounded-xl px-4 py-2.5 text-sm font-medium transition duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
          >
            {t("modal.viewMoreDetails")}
          </button>
        </div>
      ) : null}
    </div>
  );
};

function CertificateList({
  certificates,
  viewLabel,
}: {
  certificates: SkillDetailType["certificates"];
  viewLabel: string;
}) {
  return (
    <ul className="space-y-2">
      {certificates.map((certificate) => (
        <li key={certificate.id}>
          <CertificateRow certificate={certificate} viewLabel={viewLabel} />
        </li>
      ))}
    </ul>
  );
}

function ExperienceList({
  experiences,
}: {
  experiences: SkillDetailType["experiences"];
}) {
  return (
    <ul className="space-y-2">
      {experiences.map((experience) => (
        <li
          key={experience.id}
          className="bg-background-100/80 rounded-lg px-3 py-2.5"
        >
          <p className="text-primaryText-500 text-sm font-semibold">
            {experience.role}
          </p>
          <p className="text-primaryText-700 mt-0.5 flex items-center gap-1.5 text-xs">
            <MdWorkOutline className="h-3.5 w-3.5 shrink-0" />
            {experience.company}
          </p>
          {experience.dates ? (
            <p className="text-primaryText-700 mt-1 flex items-center gap-1.5 text-xs">
              <MdCalendarMonth className="h-3.5 w-3.5 shrink-0" />
              {experience.dates}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ProjectList({
  projects,
  viewProjectLabel,
  viewSourceLabel,
}: {
  projects: SkillDetailType["projects"];
  viewProjectLabel: string;
  viewSourceLabel: string;
}) {
  return (
    <ul className="space-y-2">
      {projects.map((project) => (
        <li
          key={project.id}
          className="bg-background-100/80 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-primaryText-500 truncate text-sm font-semibold">
              {project.title}
            </p>
            {project.description ? (
              <p className="text-primaryText-700 mt-0.5 line-clamp-1 text-xs">
                {project.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            {project.websiteUrl ? (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noreferrer"
                title={viewProjectLabel}
                aria-label={viewProjectLabel}
                className="text-primaryText-700 hover:bg-primary-50 hover:text-primary-600 bg-background-50 flex h-8 w-8 items-center justify-center rounded-lg transition"
              >
                <AiFillEye className="h-4 w-4" />
              </a>
            ) : null}
            {!project.isPrivate && project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                title={viewSourceLabel}
                aria-label={viewSourceLabel}
                className="text-primaryText-700 hover:bg-primary-50 hover:text-primary-600 bg-background-50 flex h-8 w-8 items-center justify-center rounded-lg transition"
              >
                <AiFillGithub className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function CertificateRow({
  certificate,
  viewLabel,
}: {
  certificate: SkillDetailType["certificates"][number];
  viewLabel: string;
}) {
  const issuedDateText = formatIssuedDate(certificate.issuedDate);

  return (
    <div className="bg-background-100/80 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-primaryText-500 truncate text-sm font-semibold">
          {certificate.title}
        </p>
        <p className="text-primaryText-700 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="inline-flex items-center gap-1">
            <MdSchool className="h-3.5 w-3.5 shrink-0" />
            {certificate.company}
          </span>
          {issuedDateText ? (
            <span className="inline-flex items-center gap-1">
              <MdCalendarMonth className="h-3.5 w-3.5 shrink-0" />
              {issuedDateText}
            </span>
          ) : null}
        </p>
      </div>
      {certificate.url ? (
        <a
          href={certificate.url}
          target="_blank"
          rel="noreferrer"
          title={viewLabel}
          aria-label={viewLabel}
          className="text-primaryText-700 hover:bg-primary-50 hover:text-primary-600 bg-background-50 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition"
        >
          <MdOpenInNew className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

function SkillModalLoading() {
  return (
    <div className="mt-6 space-y-3">
      <div className="bg-background-100 flex gap-1 rounded-xl p-1">
        <div className="bg-background-50 h-8 w-24 animate-pulse rounded-lg" />
        <div className="bg-background-50 h-8 w-24 animate-pulse rounded-lg" />
      </div>
      <div className="bg-background-100 h-14 animate-pulse rounded-lg" />
      <div className="bg-background-100 h-14 animate-pulse rounded-lg" />
    </div>
  );
}
