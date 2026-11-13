"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { SCHEDULE_PATH } from "@/utils/calendly-url";
import type { PublicContact } from "@/utils/contact-links";

interface ContactDirectCardProps {
  contacts: readonly PublicContact[];
  schedulingEnabled: boolean;
}

function cleanEmail(value: string): string {
  return value.replace(/^mailto:/i, "").trim();
}

function cleanPhone(value: string): { display: string; tel: string } {
  const digits = value.replace(/[^\d+]/g, "");
  const tel = value.replace(/^tel:/i, "").trim();
  const display = tel.replace(/,/g, " ");
  return { display, tel: digits.startsWith("+") ? digits : `+${digits}` };
}

function cleanLinkedIn(value: string): { href: string; display: string } {
  const trimmed = value.trim();
  const href = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, "")}`;
  const slug = trimmed
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/\/$/, "");
  const display = slug ? `linkedin/${slug}` : "LinkedIn";
  return { href, display };
}

function getContactLabel(contact?: PublicContact): string | null {
  if (!contact) return null;
  if (typeof contact.label === "string" && contact.label.trim()) {
    return contact.label.trim();
  }
  return null;
}

export function ContactDirectCard({
  contacts,
  schedulingEnabled,
}: ContactDirectCardProps) {
  const t = useTranslations("main.contact");
  const [isCopied, setIsCopied] = useState(false);

  const emailContact = contacts.find((c) => c.type === "EMAIL");
  const email = emailContact
    ? cleanEmail(emailContact.value)
    : "jesus.hernandez@jesushg.com";

  const phoneContact = contacts.find((c) => c.type === "PHONE");
  const phone = phoneContact
    ? {
        display:
          getContactLabel(phoneContact) ??
          cleanPhone(phoneContact.value).display,
        tel: cleanPhone(phoneContact.value).tel,
      }
    : null;

  const linkedinContact = contacts.find((c) => c.type === "LINKEDIN");
  const linkedin = linkedinContact
    ? {
        display:
          getContactLabel(linkedinContact) ??
          cleanLinkedIn(linkedinContact.value).display,
        href: cleanLinkedIn(linkedinContact.value).href,
      }
    : null;

  const handleCopy = useCallback(() => {
    if (!email) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard
        .writeText(email)
        .then(() => {
          setIsCopied(true);
          toast.success(t("direct.copied"));
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(() => {
          toast.error(t("form.errors.description"));
        });
    }
  }, [email, t]);

  return (
    <div className="home-card-surface bg-card relative box-border flex h-full w-full min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div>
        <p className="text-muted-foreground font-mono text-sm tracking-wider uppercase">
          {t("direct.eyebrow")}
        </p>

        <ul className="divide-border/50 mt-4 divide-y [&>li]:py-4">
          {/* Email row */}
          {email && (
            <li className="first:pt-1">
              <p className="text-muted-foreground text-sm">
                {t("direct.email")}
              </p>
              <p className="text-foreground mt-1 text-base font-semibold tracking-[-0.01em] break-words">
                {email}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={`mailto:${email}`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {t("direct.write")}
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={t("direct.copyEmailAria")}
                  className="bg-muted text-muted-foreground hover:text-foreground focus-visible:outline-ring inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {isCopied ? (
                    <>
                      <Check
                        className="size-4 text-emerald-500"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-500">
                        {t("direct.copied")}
                      </span>
                    </>
                  ) : (
                    <span>{t("direct.copy")}</span>
                  )}
                </button>
              </div>
            </li>
          )}

          {/* Phone row */}
          {phone && (
            <li>
              <a
                href={`tel:${phone.tel}`}
                className="group focus-visible:outline-ring flex min-h-11 items-center justify-between py-1 transition-colors focus-visible:rounded-lg focus-visible:outline-2"
              >
                <span>
                  <span className="text-muted-foreground block text-sm">
                    {t("direct.phone")}
                  </span>
                  <span className="text-foreground group-hover:text-primary mt-1 block text-base font-semibold tracking-[-0.01em] transition-colors sm:text-[1.0625rem]">
                    {phone.display}
                  </span>
                </span>
                <ChevronRight
                  className="text-muted-foreground group-hover:text-primary size-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </li>
          )}

          {/* LinkedIn row */}
          {linkedin && (
            <li>
              <a
                href={linkedin.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group focus-visible:outline-ring flex min-h-11 items-center justify-between py-1 transition-colors focus-visible:rounded-lg focus-visible:outline-2"
              >
                <span>
                  <span className="text-muted-foreground block text-sm">
                    {t("direct.linkedin")}
                  </span>
                  <span className="text-foreground group-hover:text-primary mt-1 block text-base font-semibold tracking-[-0.01em] transition-colors sm:text-[1.0625rem]">
                    {linkedin.display}
                  </span>
                </span>
                <ChevronRight
                  className="text-muted-foreground group-hover:text-primary size-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </li>
          )}

          {/* Video call row */}
          {schedulingEnabled && (
            <li>
              <Link
                href={SCHEDULE_PATH}
                className="group focus-visible:outline-ring flex min-h-11 items-center justify-between py-1 transition-colors focus-visible:rounded-lg focus-visible:outline-2"
              >
                <span>
                  <span className="text-muted-foreground block text-sm">
                    {t("direct.videoCall")}
                  </span>
                  <span className="text-foreground group-hover:text-primary mt-1 block text-base font-semibold tracking-[-0.01em] transition-colors sm:text-[1.0625rem]">
                    {t("direct.scheduleCall")}
                  </span>
                </span>
                <ChevronRight
                  className="text-muted-foreground group-hover:text-primary size-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default ContactDirectCard;
