import type { FC } from "react";
import React, { useState } from "react";

type ContactType = "email" | "phone" | "github" | "linkedin" | "whatsapp";

interface IContactItemProps {
  href: string;
  label: ContactType;
  icon: React.FC<{ className: string; style?: React.CSSProperties }>;
}

const contactColors: Record<ContactType, string> = {
  email: "#EA4335",
  phone: "#34A853",
  github: "#333333",
  linkedin: "#0077B5",
  whatsapp: "#25D366",
};

const ContactItem: FC<IContactItemProps> = ({ label, href, icon: Icon }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable group inline-block space-y-0.5 rounded-lg p-3 transition-all hover:scale-105 hover:shadow-md"
      style={{
        backgroundColor: hovered
          ? contactColors[label]
          : "var(--background-50)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon className="text-primary-500 group-hover:text-secondaryText-50 mx-auto h-5 w-5" />
      <p className="text-primaryText-500 group-hover:text-secondaryText-50 text-xs capitalize">
        {label}
      </p>
    </a>
  );
};

export default ContactItem;
