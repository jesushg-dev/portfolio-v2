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
    <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f3a8f] to-[#1d4ed8] px-8 py-9 text-white md:px-10 md:py-10">
      {/* Blueprint Grid Overlay from Prototype */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,transparent_25%,#000)] bg-[size:2.5rem_2.5rem]"
      />

      <div className="flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl leading-tight font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
            {fullName}
          </h1>
          {degree ? (
            <p className="mt-1.5 text-base font-normal text-white/90 sm:text-lg">
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
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span>{availability}</span>
            </div>
          ) : null}
        </div>

        {/* Profile Avatar / Initials */}
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_35%_30%,#7aa2ff,#1d3fae_70%)] text-3xl font-light text-white shadow-[0_1.125rem_2.5rem_rgba(0,0,0,0.35)] ring-4 ring-white/35 sm:size-28 sm:text-4xl">
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
