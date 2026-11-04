"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SCHEDULE_PATH } from "@/utils/calendly-url";

export interface ContactAlternativeLinksProps {
  linkedinUrl?: string;
  schedulingEnabled?: boolean;
}

export function ContactAlternativeLinks({
  linkedinUrl,
  schedulingEnabled,
}: ContactAlternativeLinksProps) {
  const t = useTranslations("main.contact");
  if (!linkedinUrl && !schedulingEnabled) return null;
  const className =
    "text-muted-foreground hover:text-primary rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
      {schedulingEnabled && (
        <Link href={SCHEDULE_PATH} className={className}>
          {t("scheduleCall")}
        </Link>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {t("channels.linkedin")}
        </a>
      )}
    </div>
  );
}
