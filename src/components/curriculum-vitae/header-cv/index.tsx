import type { FC, ReactNode } from "react";
import type { LocalizedCvData } from "../types";
import ClientImage from "./client-image";
import ContactMe from "../contact-me";
import { getNameInitials } from "@/lib/cv/cv-initials";

interface IHeaderCvProps {
  header?: LocalizedCvData["header"];
  fallbackName?: string | null;
  contacts?: LocalizedCvData["contacts"];
  availability?: string | null;
  contactsSlot?: ReactNode;
}

const HeaderCV: FC<IHeaderCvProps> = ({
  header,
  fallbackName,
  contacts,
  availability,
  contactsSlot,
}) => {
  const rawName = header?.fullName;
  const fullName =
    rawName != null && rawName.length > 0 ? rawName : (fallbackName ?? "");
  const degree = header?.degree ?? "";
  const alt = header?.clientImageAlt ?? fullName;
  const initials = getNameInitials(fullName);

  return (
    <header className="flex items-start justify-between gap-6 bg-[#0a3d7a] px-6 py-6 text-white md:px-10 md:py-9">
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl leading-[1.1] font-bold text-white md:text-4xl">
          {fullName}
        </h1>
        {degree ? (
          <p className="mt-1.5 text-lg text-white md:text-[1.3125rem]">
            {degree}
          </p>
        ) : null}

        {contactsSlot ? (
          <div className="mt-5">{contactsSlot}</div>
        ) : contacts && contacts.length > 0 ? (
          <div className="mt-5">
            <ContactMe contacts={contacts} variant="header" />
          </div>
        ) : null}

        {availability ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-sm font-bold text-white">
            <i
              className="block size-2 rounded-full bg-emerald-300"
              aria-hidden="true"
            />
            <span>{availability}</span>
          </p>
        ) : null}
      </div>

      <span className="flex size-28 shrink-0 items-center justify-center overflow-hidden bg-white text-4xl font-bold text-slate-800">
        {header?.photoUrl ? (
          <ClientImage src={header.photoUrl} alt={alt || fullName} />
        ) : (
          <span>{initials}</span>
        )}
      </span>
    </header>
  );
};

export default HeaderCV;
