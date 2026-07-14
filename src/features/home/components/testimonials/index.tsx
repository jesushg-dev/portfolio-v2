"use client";

import type { FC } from "react";
import { useLocale, useTranslations } from "next-intl";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/react";

const Testimonials: FC = () => {
  const locale = useLocale();
  const t = useTranslations("main.testimonials");

  const { data: items = [] } = api.portfolio.getTestimonialsPublic.useQuery({
    locale,
    limit: 3,
  });

  if (items.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="mx-auto px-4 pb-4 lg:container lg:px-20 lg:pb-20"
    >
      <HeaderArticle
        title={t("title")}
        description={t("subtitle")}
        subtitle=""
      />
      <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="bg-card text-card-foreground border-border rounded-xl border p-5 shadow-sm"
          >
            <blockquote className="text-foreground text-sm leading-relaxed italic">
              “{item.quote}”
            </blockquote>
            <footer className="text-muted-foreground mt-4 text-sm">
              <strong className="text-foreground font-semibold">
                {item.author}
              </strong>
              {item.role ? ` · ${item.role}` : ""}
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Testimonials;
