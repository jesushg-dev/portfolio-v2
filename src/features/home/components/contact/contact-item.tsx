"use client";

import type { FC, CSSProperties } from "react";
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
import { cn } from "@/lib/utils";

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
  accent?: string;
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

  const effectiveAccent = accent && accent.length > 0 ? accent : "var(--primary)";

  const style = {
    "--contact-accent": effectiveAccent,
  } as CSSProperties;

  const className = cn(
    "group inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-card-foreground shadow-2xs transition-all",
    "hover:border-transparent hover:bg-[var(--contact-accent)] hover:text-white hover:shadow-md active:scale-[0.98]"
  );

  return isInternal ? (
    <Link
      href={href as "/schedule"}
      aria-label={ariaLabel ?? label}
      className={className}
      style={style}
    >
      <Icon className="size-3.5 shrink-0 text-primary transition-all group-hover:scale-110 group-hover:text-white" />
      <span className="truncate">{label}</span>
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? label}
      className={className}
      style={style}
    >
      <Icon className="size-3.5 shrink-0 text-primary transition-all group-hover:scale-110 group-hover:text-white" />
      <span className="truncate">{label}</span>
    </a>
  );
};

export default ContactItem;
