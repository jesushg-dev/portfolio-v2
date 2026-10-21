import type { FC } from "react";
import { FaLinkedin, FaGithub, FaCalendarAlt } from "react-icons/fa";
import { MdPhone, MdEmail, MdWeb, MdLocationOn } from "react-icons/md";
import type { CvContactType } from "@prisma/client";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { SCHEDULE_PATH } from "@/utils/calendly-url";
import type { LocalizedCvData } from "./types";

interface IContactMeProps {
  contacts: LocalizedCvData["contacts"];
  variant?: "header" | "sidebar";
}

const ICONS: Record<CvContactType, typeof MdWeb> = {
  PHONE: MdPhone,
  EMAIL: MdEmail,
  WEBSITE: MdWeb,
  LINKEDIN: FaLinkedin,
  GITHUB: FaGithub,
  LOCATION: MdLocationOn,
  CALENDLY: FaCalendarAlt,
  OTHER: MdWeb,
};

const buildHref = (type: CvContactType, value: string) => {
  switch (type) {
    case "EMAIL":
      return value.startsWith("mailto:") ? value : `mailto:${value}`;
    case "PHONE":
      return value.startsWith("tel:")
        ? value
        : `tel:${value.replace(/[^+\d]/g, "")}`;
    case "CALENDLY":
      return SCHEDULE_PATH;
    default:
      return value;
  }
};

const isInternalHref = (href: string) => href.startsWith("/");

function ContactItem({
  contact,
  variant,
}: {
  contact: LocalizedCvData["contacts"][number];
  variant: "header" | "sidebar";
}) {
  const Icon = ICONS[contact.type] ?? MdWeb;
  const label = contact.label || contact.value;
  const href = buildHref(contact.type, contact.value);
  const linkClassName =
    variant === "header"
      ? "inline-flex items-center gap-1.5 text-white hover:underline text-sm"
      : "relative z-10 inline-flex min-h-11 items-center gap-1 py-0 text-[#1a1a1a] hover:underline";
  const iconClassName =
    variant === "header" ? "size-4 shrink-0 text-white" : "size-3 shrink-0";
  const opensInNewTab =
    !isInternalHref(href) &&
    !href.startsWith("tel:") &&
    !href.startsWith("mailto:");

  const content = (
    <>
      <Icon className={iconClassName} aria-hidden />
      <span>{label}</span>
    </>
  );

  return (
    <li className={variant === "header" ? "" : "relative -my-3.5"}>
      {isInternalHref(href) ? (
        <Link href={href as typeof SCHEDULE_PATH} className={linkClassName}>
          {content}
        </Link>
      ) : (
        <a
          className={linkClassName}
          href={href}
          {...(opensInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {content}
        </a>
      )}
    </li>
  );
}

const ContactMe: FC<IContactMeProps> = ({ contacts, variant = "sidebar" }) => {
  const t = useTranslations("curriculum");

  if (!contacts.length) return null;

  if (variant === "header") {
    return (
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {contacts.map((contact) => (
          <ContactItem key={contact.id} contact={contact} variant="header" />
        ))}
      </ul>
    );
  }

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.contact")}
      </h5>

      <div className="mb-4">
        <ul className="list-none text-sm leading-none">
          {contacts.map((contact) => (
            <ContactItem key={contact.id} contact={contact} variant="sidebar" />
          ))}
        </ul>
      </div>
    </>
  );
};

export default ContactMe;
