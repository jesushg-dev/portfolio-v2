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
    <header className="from-primary to-primary/80 text-primary-foreground relative isolate overflow-hidden bg-gradient-to-br px-8 py-9 md:px-10 md:py-10">
      <div className="flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="text-primary-foreground text-2xl leading-tight font-bold tracking-tight sm:text-3xl lg:text-[2rem]">
            {fullName}
          </h1>
          {degree ? (
            <p className="text-primary-foreground/90 mt-1.5 text-base font-normal sm:text-lg">
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
            <div className="bg-primary-foreground/15 text-primary-foreground mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-current" />
              </span>
              <span>{availability}</span>
            </div>
          ) : null}
        </div>

        {/* Profile Avatar / Initials */}
        <div className="bg-primary-foreground/15 text-primary-foreground ring-primary-foreground/35 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-3xl font-light shadow-xl ring-4 sm:size-28 sm:text-4xl">
          {header?.photoUrl ? (
            <ClientImage src={header.photoUrl} alt={alt || fullName} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderCV;
