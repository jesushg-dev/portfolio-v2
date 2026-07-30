"use client";

import type { FC, CSSProperties, MouseEvent } from "react";
import {
  FaCalendarAlt,
  FaGithub,
  FaGlobe,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRegEnvelope,
  FaWhatsapp,
} from "react-icons/fa";
import type { IconType } from "react-icons";

import { Link } from "@/i18n/routing";
import type { ContactIconKey } from "@/utils/contact-links";

const CONTACT_ICONS: Record<ContactIconKey, IconType> = {
  email: FaRegEnvelope,
  phone: FaPhoneAlt,
  whatsapp: FaWhatsapp,
  linkedin: FaLinkedin,
  github: FaGithub,
  website: FaGlobe,
  location: FaMapMarkerAlt,
  calendly: FaCalendarAlt,
};

interface ContactItemProps {
  href: string;
  label: string;
  icon: ContactIconKey;
  accent: string;
  ariaLabel?: string;
}

const ContactItem: FC<ContactItemProps> = ({
  href,
  label,
  icon,
  accent,
  ariaLabel,
}) => {
  const Icon = CONTACT_ICONS[icon];
  const isInternal = href.startsWith("/");

  const className =
    "border-border/60 bg-background/50 text-foreground group inline-flex min-w-20 cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-md";

  const content = (
    <>
      <Icon className="text-primary size-5 transition-colors group-hover:text-white" />
      <span className="text-muted-foreground text-[0.7rem] font-medium tracking-wide capitalize group-hover:text-white/90">
        {label}
      </span>
    </>
  );

  const style = {
    "--contact-accent": accent,
  } as CSSProperties;

  const onMouseEnter = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.backgroundColor = accent;
  };

  const onMouseLeave = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.backgroundColor = "";
  };

  if (isInternal) {
    return (
      <Link
        href={href as "/schedule"}
        aria-label={ariaLabel ?? label}
        className={className}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? label}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </a>
  );
};

export default ContactItem;
