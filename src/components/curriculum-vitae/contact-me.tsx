import type { ComponentProps, ComponentType, FC } from "react";
import { Calendar, Globe, Mail, MapPin, Phone } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/shared/brand-icons";
import type { CvContactType } from "@prisma/client";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { SCHEDULE_PATH } from "@/utils/calendly-url";
import type { LocalizedCvData } from "./types";

interface IContactMeProps {
  contacts: LocalizedCvData["contacts"];
  variant?: "header" | "sidebar";
}

const ICONS: Record<CvContactType, ComponentType<{ className?: string }>> = {
  PHONE: Phone,
  EMAIL: Mail,
  WEBSITE: Globe,
  LINKEDIN: LinkedinIcon,
  GITHUB: GithubIcon,
  LOCATION: MapPin,
  CALENDLY: Calendar,
  OTHER: Globe,
};

const buildHref = (type: CvContactType, rawValue: string): string | null => {
  const value = rawValue.trim();
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
      if (/^\/(?![\/\\])/.test(value)) return value;
      try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol) ? url.href : null;
      } catch {
        return null;
      }
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
  const Icon = ICONS[contact.type] ?? Globe;
  const label = contact.label || contact.value;
  const href = buildHref(contact.type, contact.value);
  if (!href) {
    return (
      <span className="text-muted-foreground inline-flex min-h-8 items-center gap-2 text-xs">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }
  const opensInNewTab =
    !href.startsWith("mailto:") &&
    !href.startsWith("tel:") &&
    !isInternalHref(href);

  if (variant === "header") {
    const content = (
      <div className="flex flex-col text-left">
        {contact.label ? (
          <span className="text-primary-foreground/60 text-[0.625rem] font-semibold tracking-wider uppercase">
            {contact.label}
          </span>
        ) : null}
        <span className="text-primary-foreground truncate text-xs font-medium hover:underline">
          {contact.value}
        </span>
      </div>
    );

    if (isInternalHref(href)) {
      return (
        <Link
          href={href as ComponentProps<typeof Link>["href"]}
          className="group flex items-start gap-1.5 py-0.5"
        >
          <Icon className="text-primary-foreground/70 group-hover:text-primary-foreground mt-0.5 size-3.5 shrink-0" />
          {content}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target={opensInNewTab ? "_blank" : undefined}
        rel={opensInNewTab ? "noopener noreferrer" : undefined}
        className="group flex items-start gap-1.5 py-0.5"
      >
        <Icon className="text-primary-foreground/70 group-hover:text-primary-foreground mt-0.5 size-3.5 shrink-0" />
        {content}
      </a>
    );
  }

  // Sidebar variant
  const sidebarClass =
    "inline-flex min-h-8 items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:underline";

  if (isInternalHref(href)) {
    return (
      <Link
        href={href as ComponentProps<typeof Link>["href"]}
        className={sidebarClass}
      >
        <Icon className="text-primary size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={opensInNewTab ? "_blank" : undefined}
      rel={opensInNewTab ? "noopener noreferrer" : undefined}
      className={sidebarClass}
    >
      <Icon className="text-primary size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}

const ContactMe: FC<IContactMeProps> = ({ contacts, variant = "sidebar" }) => {
  const t = useTranslations("curriculum");
  if (!contacts || contacts.length === 0) return null;

  if (variant === "header") {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {contacts.map((contact) => (
          <ContactItem
            key={`${contact.type}-${contact.value}`}
            contact={contact}
            variant="header"
          />
        ))}
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-primary before:bg-primary mb-2.5 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase before:h-3.5 before:w-1 before:rounded-xs before:content-['']">
        {t("header.contact")}
      </h2>
      <div className="flex flex-col gap-1">
        {contacts.map((contact) => (
          <ContactItem
            key={`${contact.type}-${contact.value}`}
            contact={contact}
            variant="sidebar"
          />
        ))}
      </div>
    </section>
  );
};

export default ContactMe;
