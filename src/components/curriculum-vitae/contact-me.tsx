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
}: {
  contact: LocalizedCvData["contacts"][number];
}) {
  const Icon = ICONS[contact.type] ?? MdWeb;
  const label = contact.label || contact.value;
  const href = buildHref(contact.type, contact.value);
  const linkClassName =
    "relative z-10 inline-flex min-h-11 items-center gap-1 py-0 text-[#1a1a1a] hover:underline";
  const opensInNewTab =
    !isInternalHref(href) &&
    !href.startsWith("tel:") &&
    !href.startsWith("mailto:");

  return (
    <li className="relative -my-3.5">
      {isInternalHref(href) ? (
        <Link href={href as typeof SCHEDULE_PATH} className={linkClassName}>
          <Icon className="size-3 shrink-0" aria-hidden />
          {label}
        </Link>
      ) : (
        <a
          className={linkClassName}
          href={href}
          {...(opensInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <Icon className="size-3 shrink-0" aria-hidden />
          {label}
        </a>
      )}
    </li>
  );
}

const ContactMe: FC<IContactMeProps> = ({ contacts }) => {
  const t = useTranslations("curriculum");

  if (!contacts.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.contact")}
      </h5>

      <div className="mb-4">
        <ul className="list-none text-sm leading-none">
          {contacts.map((contact) => (
            <ContactItem key={contact.id} contact={contact} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default ContactMe;
