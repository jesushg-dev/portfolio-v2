import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { ShowcaseHeading } from "@/components/shared/showcase";
import { api } from "@/trpc/server";
import ViewportSection from "@/components/shared/viewport-section";
import { Skeleton } from "@/components/ui/skeleton";
import ContactForm from "./contact-form-lazy";
import ContactIllustration from "./contact-illustration";
import { ContactLayout } from "./contact-layout";
import { ContactDirectCard } from "./contact-direct-card";
import { buildContactLinks } from "@/utils/contact-links";
import { getCalendlyUrl } from "@/utils/calendly-url";
import { cn } from "@/lib/utils";

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
      className="border-border/80 relative isolate w-full overflow-hidden border-t py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="bg-primary/5 pointer-events-none absolute top-1/4 right-0 -z-10 size-80 rounded-full blur-3xl"
      />
      <div className="relative mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <ShowcaseHeading
          sectionId="contact"
          title={t("titleLead")}
          titleGradient={t("titleGradient")}
          description={t("subtitle")}
          eyebrow={t("eyebrow")}
          align="center"
          className="mb-10 sm:mb-12 md:mb-14"
        />

        <ContactLayout showContactForm={showContactForm}>
          {showContactForm && (
            <ViewportSection
              fallback={<Skeleton className="min-h-96 w-full rounded-[2rem]" />}
              minHeight="24rem"
              className="flex min-w-0 flex-1 flex-col"
              requiresInteraction
            >
              <ContactForm
                linkedinUrl={linkedinUrl}
                schedulingEnabled={schedulingEnabled}
                responseTime={data.responseTime}
              />
            </ViewportSection>
          )}

          <ContactDirectCard
            contacts={data.contacts}
            schedulingEnabled={schedulingEnabled}
          />

          <div className={cn(showContactForm && "md:col-span-2")}>
            <ContactIllustration
              location={data.mapLocation}
              timezone={data.timezone}
            />
          </div>
        </ContactLayout>
      </div>
    </section>
  );
};

export default Contact;
