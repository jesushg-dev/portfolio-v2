import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  MdCalendarMonth,
  MdSchool,
  MdOutlinePin,
  MdRemoveRedEye,
} from "react-icons/md";
import type { FC } from "react";

import type { CertificateType } from "@/utils/interfaces/types";

const formatIssuedDate = (issuedDate: number | null) => {
  if (!issuedDate) return "";
  const date = new Date(issuedDate);
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return `${month}, ${year}`;
};

const CertificateItem: FC<CertificateType> = ({
  image,
  title,
  issuedDate,
  url = "",
  company,
  idCredential,
}) => {
  const t = useTranslations("certification");
  const issuedDateText = formatIssuedDate(issuedDate);

  return (
    <div className="group relative h-full w-full pb-1 transition-all lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
      <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-4 lg:block lg:group-hover:bg-background-600/50 lg:group-hover:bg-background-800 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg" />
      <article className="flex h-full w-full flex-col gap-3">
        <div className="relative max-h-[12.5rem] min-h-[12.5rem] w-full overflow-hidden rounded-[0.625rem] bg-white">
          <a href={url || ""} target="_blank" rel="noopener noreferrer">
            <Image
              src={
                image ??
                "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp"
              }
              width={352}
              height={264}
              alt={title}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
            />
          </a>
        </div>
        <div className="z-10 flex flex-grow flex-col items-start justify-between gap-1">
          <h5 className="hover:text-primary mb-0 md:font-semibold">
            <a
              href={url || ""}
              title={t("seeCertificate")}
              target="_blank"
              rel="noopener noreferrer"
            >
              {title}
            </a>
          </h5>
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <div className="flex items-center text-sm">
                {issuedDate && (
                  <div className="flex items-center" title={t("titles.date")}>
                    <MdCalendarMonth />
                    <p className="pl-2">{issuedDateText}</p>
                  </div>
                )}
                <div
                  className="flex items-center pl-5"
                  title={t("titles.institution")}
                >
                  <MdSchool /> <p className="pl-2"> {company}</p>
                </div>
              </div>
              {idCredential && (
                <div
                  className="flex items-center"
                  title={t("titles.idCredential")}
                >
                  <MdOutlinePin />
                  <p className="pl-2 text-xs">{idCredential}</p>
                </div>
              )}
            </div>
            {url && (
              <a
                href={url}
                title={t("seeCertificate")}
                target="_blank"
                rel="noreferrer"
                className="pressable rounded-md bg-primary-700 px-4 py-2 shadow-lg hover:bg-primary-800"
              >
                <span className="flex w-full items-center justify-center gap-2 text-center text-xs text-secondaryText-50">
                  <MdRemoveRedEye className="h-4 w-4" />
                  {t("seeCertificate")}
                </span>
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default CertificateItem;
