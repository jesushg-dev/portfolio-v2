import type { FC } from "react";
import { FaLinkedin, FaGithub, FaCalendarAlt } from "react-icons/fa";
import { MdPhone, MdEmail, MdWeb, MdLocationOn } from "react-icons/md";
import type { CvContactType } from "@prisma/client";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface IContactMeProps extends CvLocaleProps {
  contacts: CvData["contacts"];
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
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    default:
      return value;
  }
};

const ContactMe: FC<IContactMeProps> = ({
  contacts,
  locale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  if (!contacts.length) return null;

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.contact")}
      </h5>

      <div className="mb-4">
        <ul className="list-none text-xs">
          {contacts.map((contact) => {
            const Icon = ICONS[contact.type] ?? MdWeb;
            const label =
              getLocalizedText(contact.label, locale, defaultLocale) ||
              contact.value;
            return (
              <li key={contact.id}>
                <a
                  target="_blank"
                  className="flex items-center gap-2"
                  rel="noopener noreferrer"
                  href={buildHref(contact.type, contact.value)}
                >
                  <Icon className="text-xs" />
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default ContactMe;
