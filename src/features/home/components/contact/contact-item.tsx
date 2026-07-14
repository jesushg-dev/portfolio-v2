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
}

const ContactItem: FC<ContactItemProps> = ({ href, label, icon, accent }) => {
  const Icon = CONTACT_ICONS[icon];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="border-border/60 bg-background/50 text-foreground group inline-flex min-w-20 flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-md"
      style={
        {
          "--contact-accent": accent,
        } as CSSProperties
      }
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = accent;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = "";
      }}
    >
      <Icon className="text-primary size-5 transition-colors group-hover:text-white" />
      <span className="text-muted-foreground text-[0.7rem] font-medium tracking-wide capitalize group-hover:text-white/90">
        {label}
      </span>
    </a>
  );
};

export default ContactItem;
