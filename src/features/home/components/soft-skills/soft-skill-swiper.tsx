"use client";
import type { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import {
  RiHandHeartLine,
  RiDashboard3Line,
  RiSettingsLine,
  RiTimerFlashLine,
  RiMapPinTimeLine,
  RiMedal2Line,
  RiTeamLine,
  RiShieldStarLine,
} from "react-icons/ri";

import SoftSkillItem from "./soft-skill-item";

import { useTranslations } from "next-intl";

const SoftSkillSwiper: FC = () => {
  const t = useTranslations("main.soft-skills");

  return (
    <Swiper
      loop
      slidesPerView={1}
      autoplay={{
        delay: 1500,
        disableOnInteraction: false,
      }}
      breakpoints={{
        320: { slidesPerView: 1 },
        480: { slidesPerView: 2 },
        640: { slidesPerView: 3 },
        768: { slidesPerView: 4 },
        1024: { slidesPerView: 5 },
      }}
      modules={[Autoplay, Navigation]}
    >
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiTeamLine}
          title={t("skills.teamwork.title")}
          description={t("skills.teamwork.description")}
        />
      </SwiperSlide>
      {/* <SwiperSlide className="text-center"><SoftSkillItem
       icon={RiEmotion2Line}
       title={t('skills.communication.title')}
       description={t('skills.communication.description')}
     /></SwiperSlide> */}
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiShieldStarLine}
          title={t("skills.problemSolving.title")}
          description={t("skills.problemSolving.description")}
        />
      </SwiperSlide>
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiMedal2Line}
          title={t("skills.goalOriented.title")}
          description={t("skills.goalOriented.description")}
        />
      </SwiperSlide>
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiSettingsLine}
          title={t("skills.adaptability.title")}
          description={t("skills.adaptability.description")}
        />
      </SwiperSlide>
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiTimerFlashLine}
          title={t("skills.timeManagement.title")}
          description={t("skills.timeManagement.description")}
        />
      </SwiperSlide>
      {/* <SwiperSlide className="text-center"><SoftSkillItem
       icon={RiQuillPenLine}
       title={t('skills.creativity.title')}
       description={t('skills.creativity.description')}
   /></SwiperSlide> */}
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiHandHeartLine}
          title={t("skills.leadership.title")}
          description={t("skills.leadership.description")}
        />
      </SwiperSlide>
      {/* <SwiperSlide className="text-center"><SoftSkillItem
       icon={RiCalendarTodoLine}
       title={t('skills.organization.title')}
       description={t('skills.organization.description')}
     /></SwiperSlide> */}
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiMapPinTimeLine}
          title={t("skills.responsibility.title")}
          description={t("skills.responsibility.description")}
        />
      </SwiperSlide>
      {/*
      <SwiperSlide className="text-center"><SoftSkillItem
       icon={RiGpsLine}
       title={t('skills.initiative.title')}
       description={t('skills.initiative.description')}
     /> */}
      <SwiperSlide className="text-center">
        <SoftSkillItem
          icon={RiDashboard3Line}
          title={t("skills.commitment.title")}
          description={t("skills.commitment.description")}
        />
      </SwiperSlide>
    </Swiper>
  );
};

export default SoftSkillSwiper;
