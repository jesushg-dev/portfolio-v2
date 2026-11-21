import type { FC, ComponentType } from "react";
import { Calendar, Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  GithubIcon,
  LinkedinIcon,
  WhatsappIcon,
} from "@/components/shared/brand-icons";

import { Link } from "@/i18n/routing";
import type { ContactIconKey } from "@/utils/contact-links";
import { cn } from "@/lib/utils";

const CONTACT_ICONS: Record<
  ContactIconKey,
  ComponentType<{ className?: string }>
> = {
  email: Mail,
  phone: Phone,
  whatsapp: WhatsappIcon,
  linkedin: LinkedinIcon,
  github: GithubIcon,
  website: Globe,
  location: MapPin,
  calendly: Calendar,
};

export function ContactChannelIcon({
  icon,
  className,
}: {
  icon: ContactIconKey;
  className: string;
}) {
  const Icon = CONTACT_ICONS[icon];
  return <Icon className={className} aria-hidden="true" />;
}

interface ContactItemProps {
  href: string;
  label: string;
  icon: ContactIconKey;
  ariaLabel?: string;
}

const ContactItem: FC<ContactItemProps> = ({
  href,
  label,
  icon,
  ariaLabel,
}) => {
  const isInternal = href.startsWith("/");

  const isEmail = href.startsWith("mailto:");

  const className = cn(
    "group inline-flex min-h-11 items-center gap-2 rounded-full border border-border/50 bg-card/35 px-4 py-2.5 text-sm font-medium text-foreground backdrop-blur-lg transition-colors duration-200",
    "hover:border-primary/25 hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]",
  );

  const linkNode = isInternal ? (
    <Link
      href={href as "/schedule"}
      aria-label={ariaLabel ?? label}
      className={className}
    >
      <ContactChannelIcon
        icon={icon}
        className="text-primary size-4 shrink-0"
      />
      <span className="truncate">{label}</span>
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? label}
      className={className}
    >
      <ContactChannelIcon
        icon={icon}
        className="text-primary size-4 shrink-0"
      />
      <span className="truncate">{label}</span>
    </a>
  );

  if (isEmail) {
    return (
      <>
        <span
          className="contents"
          dangerouslySetInnerHTML={{ __html: "<!--email_off-->" }}
        />
        {linkNode}
        <span
          className="contents"
          dangerouslySetInnerHTML={{ __html: "<!--/email_off-->" }}
        />
      </>
    );
  }

  return linkNode;
};

export default ContactItem;
