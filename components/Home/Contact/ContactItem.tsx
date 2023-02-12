import React, { FC } from 'react';

type ContactType = 'email' | 'phone' | 'github' | 'linkedin' | 'whatsapp';

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
      className={`pressable group inline-block space-y-0.5 rounded-lg bg-background-50 p-3 transition-all hover:scale-105 hover:shadow-md hover:bg-${label}`}>
      <Icon className="mx-auto h-5 w-5 text-primary-500 group-hover:text-neutralText-50" />
      <p className="text-xs capitalize text-secondaryText-500 group-hover:text-neutralText-50">{label}</p>
    </a>
  );
};

export default ContactItem;
