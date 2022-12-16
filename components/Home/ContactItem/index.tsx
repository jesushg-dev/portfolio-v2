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
      className={`pressable group inline-block space-y-0.5 rounded-lg bg-gray-50 p-3 transition-all hover:scale-105 hover:shadow-md hover:bg-${label}`}>
      <Icon className="mx-auto h-5 w-5 text-blue-500 group-hover:text-white" />
      <p className="text-xs capitalize text-gray-500 group-hover:text-white">{label}</p>
    </a>
  );
};

export default ContactItem;
