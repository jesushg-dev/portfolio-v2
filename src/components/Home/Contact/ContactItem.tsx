import type { FC } from "react";
import React from "react";

type ContactType = "email" | "phone" | "github" | "linkedin" | "whatsapp";

interface IContactItemProps {
  href: string;
  label: ContactType;
  icon: React.FC<{ className: string }>;
}

const ContactItem: FC<IContactItemProps> = ({ label, href, icon: Icon }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`pressable group bg-background-50 inline-block space-y-0.5 rounded-lg p-3 transition-all hover:scale-105 hover:shadow-md hover:bg-${label}`}
    >
      <Icon className="text-primary-500 group-hover:text-secondaryText-50 mx-auto h-5 w-5" />
      <p className="text-primaryText-500 group-hover:text-secondaryText-50 text-xs capitalize">
        {label}
      </p>
    </a>
  );
};

export default ContactItem;
