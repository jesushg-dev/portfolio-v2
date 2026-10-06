import type { FC } from "react";
import { getLocale } from "next-intl/server";

import { type Locale, locales } from "@/i18n/config";
import { getCachedSoftSkillsPublic } from "@/lib/soft-skills/get-cached-soft-skills-public";
import SoftSkillsBentoLazy from "./soft-skills-bento-lazy";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const SoftSkills: FC = async () => {
  const locale = await getLocale();

  const data = isLocale(locale)
    ? await getCachedSoftSkillsPublic(locale)
    : null;

  const items = data?.items ?? [];
  const metrics = data?.metrics ?? [];

  if (items.length === 0) return null;

  return (
    <div className="relative w-full">
      <section
        id="leadership"
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        <SoftSkillsBentoLazy items={items} metrics={metrics} />
      </section>
    </div>
  );
};

export default SoftSkills;
