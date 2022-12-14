import React, { FC } from 'react';

type ContactType = 'email' | 'phone' | 'github' | 'linkedin' | 'whatsapp';

interface IContactItemProps {
  href: string;
  label: ContactType;
  icon: React.FC<{ className: string }>;
}

/**
  .icon {
        transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0px 10px 10px rgba(0,0,0,0.1);
    }


    .tooltip {
        padding: 5px 8px;
        box-shadow: 0 10px 10px rgba(0, 0, 0, 0.1);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        &::before {
            background-color: #ffffff;
            transform: translate(-50%) rotate(45deg);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

}.wrapper .github:hover,
.wrapper .github:hover .tooltip,
.wrapper .github:hover .tooltip::before {
    border-color: $github-color;
    background-color: $github-color;
    color: #ffffff;
}

 */

const ContactItem: FC<IContactItemProps> = ({ label, href, icon: Icon }) => {
  //hover:bg-[${colors[label]}] hover:border-[${colors[label]}]
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <div
        className={`group relative m-3 flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-full border-4 border-indigo-500 bg-white p-3 text-lg shadow-icon hover:bg-${label} hover:border-${label}`}>
        <div
          className={`before:border-${label} before:bg-${label} pointer-events-none absolute top-0 rounded-md bg-white text-sm capitalize text-white opacity-0 before:absolute before:left-1/2 before:-bottom-1 before:contents before:h-2 before:w-2 before:bg-white before:text-white group-hover:pointer-events-auto group-hover:visible group-hover:-top-11 group-hover:opacity-100`}>
          {label}
        </div>
        <Icon className="text-2xl text-black group-hover:text-white" />
      </div>
    </a>
  );
};

export default ContactItem;
