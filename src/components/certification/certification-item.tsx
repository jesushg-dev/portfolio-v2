"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MdCalendarMonth, MdRemoveRedEye, MdSchool } from "react-icons/md";
import type { FC } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { CertificateType } from "@/utils/interfaces/types";
import { formatIssuedDate } from "./format-issued-date";

const CertificateItem: FC<CertificateType> = ({
  image,
  title,
  issuedDate,
  url = "",
  company,
}) => {
  const locale = useLocale();
  const t = useTranslations("certification");
  const issuedDateText = formatIssuedDate(issuedDate, locale);
  const certificateUrl = url?.trim() ?? "";

  return (
    <article className="border-border/60 bg-card text-card-foreground flex h-full w-full flex-col overflow-hidden rounded-xl border shadow-xs transition-shadow hover:shadow-md">
      <div className="border-border/40 bg-background relative flex h-44 items-center justify-center overflow-hidden border-b p-4 sm:h-48 md:h-52">
        {certificateUrl ? (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex h-full w-full items-center justify-center"
            aria-label={`${title} — ${t("seeCertificate")}`}
          >
            <Image
              src={
                image ??
                "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp"
              }
              width={400}
              height={300}
              alt={title}
              className="max-h-full max-w-full object-contain"
            />
          </a>
        ) : (
          <Image
            src={
              image ??
              "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp"
            }
            width={400}
            height={300}
            alt={title}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {issuedDate ? (
            <span className="flex items-center gap-1.5">
              <MdCalendarMonth className="size-3.5 shrink-0" aria-hidden />
              <span>{issuedDateText}</span>
            </span>
          ) : null}
          <span className="flex min-w-0 items-center gap-1.5">
            <MdSchool className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{company}</span>
          </span>
        </div>

        {certificateUrl ? (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className: "shrink-0",
            })}
          >
            <MdRemoveRedEye className="size-3.5" aria-hidden />
            {t("seeCertificate")}
          </a>
        ) : null}
      </div>
    </article>
  );
};

export default CertificateItem;
