import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Calendar } from "lucide-react";
import { ShowcaseHeading } from "@/components/shared/showcase";
import { api } from "@/trpc/server";
import { Link } from "@/i18n/routing";
import ViewportSection from "@/components/shared/viewport-section";
import { Skeleton } from "@/components/ui/skeleton";
import ContactForm from "./contact-form-lazy";
import ContactIllustration from "./contact-illustration";
import ContactItem from "./contact-item";
import { ContactLayout } from "./contact-layout";
import { buildContactLinks } from "@/utils/contact-links";
import { getCalendlyUrl, SCHEDULE_PATH } from "@/utils/calendly-url";

const Contact: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({ locale, namespace: "main.contact" });
  const data = await api.contact.getPublic({ locale });
  const links = buildContactLinks(data.contacts, {
    excludePortfolioUrl: data.portfolioUrl ?? undefined,
  });
  const schedulingEnabled = Boolean(getCalendlyUrl(data.contacts));
  const linkedinUrl = links.find((link) => link.icon === "linkedin")?.href;
  const showContactForm = data.emailFormEnabled;

  return (
    <section
      aria-labelledby="contact-heading"
      className="relative isolate w-full overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="bg-primary/5 pointer-events-none absolute top-1/4 right-0 -z-10 size-80 rounded-full blur-3xl"
      />
      <div className="relative mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <ContactLayout showContactForm={showContactForm}>
          <div className="relative flex min-w-0 flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
            <div className="space-y-7">
              <ShowcaseHeading
                sectionId="contact"
                title={t("titleLead")}
                titleGradient={t("titleGradient")}
                description={t("subtitle")}
                eyebrow={t("eyebrow")}
                align="left"
                className="mb-0!"
              />
              {links.length > 0 ? (
                <ul className="flex flex-wrap gap-2.5">
                  {links.map((link) => (
                    <li key={link.key}>
                      <ContactItem
                        href={link.href}
                        label={t(`channels.${link.icon}`)}
                        icon={link.icon}
                        ariaLabel={t(`channels.${link.icon}`)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {showContactForm
                    ? t("noChannels")
                    : t("noChannelsWithoutForm")}
                </p>
              )}
              {schedulingEnabled && (
                <Link
                  href={SCHEDULE_PATH}
                  aria-label={t("scheduleCallCalendlyAria")}
                  className="group/btn text-primary hover:bg-primary/5 focus-visible:outline-ring inline-flex min-h-12 w-fit items-center gap-3 rounded-full py-2 pr-4 pl-2 text-sm font-semibold transition-colors focus-visible:outline-2"
                >
                  <span className="bg-primary/10 grid size-10 place-items-center rounded-full">
                    <Calendar className="size-4.5" />
                  </span>
                  <span>{t("scheduleCall")}</span>
                  <ArrowUpRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </Link>
              )}
            </div>
            <ContactIllustration
              location={data.mapLocation}
              timezone={data.timezone}
            />
          </div>
          {showContactForm && (
            <div className="border-border/50 relative flex min-w-0 flex-col border-t p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
              <ViewportSection
                fallback={<Skeleton className="h-80 w-full rounded-3xl" />}
                minHeight="20rem"
                className="flex flex-1 flex-col"
                requiresInteraction
              >
                <ContactForm
                  linkedinUrl={linkedinUrl}
                  schedulingEnabled={schedulingEnabled}
                  responseTime={data.responseTime}
                />
              </ViewportSection>
            </div>
          )}
        </ContactLayout>
      </div>
    </section>
  );
};

export default Contact;
