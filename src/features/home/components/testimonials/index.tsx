"use client";

import type { FC } from "react";
import { MediaImage } from "@/components/shared/media-image";
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
            <footer className="mt-4 flex items-center gap-3 text-sm">
              {item.avatarUrl ? (
                <div className="border-border relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border shadow-sm">
                  <MediaImage
                    src={item.avatarUrl}
                    alt={item.author}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <span className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm">
                  {item.author
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <div className="flex flex-col">
                <strong className="text-foreground font-semibold">
                  {item.author}
                </strong>
                {item.role ? (
                  <span className="text-muted-foreground text-xs">
                    {item.role}
                  </span>
                ) : null}
              </div>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Testimonials;
