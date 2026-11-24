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
import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import { initialsFromDisplayName } from "@/lib/site-brand/site-brand";
import { IOSFoldableDevice } from "@/components/shared/ios-device/ios-foldable-device";

import { ContactChannelIcon } from "./contact-item";
import HeroPhotoImage from "../hero-photo-image";
import { buildVCard, filterContactChannels } from "./lib/contact-server-data";

const Contact: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({ locale, namespace: "main.contact" });
  const [data, profile] = await Promise.all([
    api.contact.getPublic({ locale }),
    getCachedHeroPublic(locale),
  ]);
  const links = buildContactLinks(data.contacts, {
    excludePortfolioUrl: data.portfolioUrl ?? undefined,
  });
  const schedulingEnabled = Boolean(getCalendlyUrl(data.contacts));
  const linkedinUrl = links.find((link) => link.icon === "linkedin")?.href;
  const showContactForm = data.emailFormEnabled;
  const name = profile?.fullName?.trim() ?? data.displayName ?? "";
  const phoneText = await getTranslations({
    locale,
    namespace: "main.heroMain.phone",
  });
  const channels = filterContactChannels(links);
  const vcard = buildVCard({
    name,
    title: profile?.heroSubtitle ?? "",
    links,
  });

  return (
    <section
      aria-labelledby="contact-heading"
      className="cs-sec relative isolate w-full pb-16 sm:pb-20 lg:pb-24"
    >
      <IOSFoldableDevice
        profile={{
          name,
          subtitle: profile?.heroSubtitle ?? "",
          photo: profile?.photoUrl ?? "",
          initials: initialsFromDisplayName(name, 2),
          locale,
          location: data.mapLocation?.label ?? "",
          addLabel: phoneText("add"),
          channels: channels.map((link) => link.icon),
        }}
      >
        <span className="cs-av relative">
          {profile?.photoUrl ? (
            <HeroPhotoImage
              photoUrl={profile.photoUrl}
              imageAlt=""
              className="size-full object-cover object-[center_15%]"
            />
          ) : (
            initialsFromDisplayName(name, 2)
          )}
        </span>
        <h3>{name}</h3>
        <p>{profile?.heroSubtitle}</p>
        <small>{data.mapLocation?.label}</small>
        <div className="cs-ic">
          {channels.map((link) => (
            <a
              key={link.key}
              href={link.href}
              aria-label={t(`channels.${link.icon}`)}
            >
              <ContactChannelIcon icon={link.icon} className="size-5" />
            </a>
          ))}
        </div>
        <a
          className="cs-add"
          href={`data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`}
          download={`${name}.vcf`}
        >
          {phoneText("add")}
        </a>
      </IOSFoldableDevice>
      <div
        data-contact-container
        className="relative mx-auto w-full px-4 pt-6 sm:px-6 sm:pt-8 lg:container lg:px-20"
      >
        <div data-contact-title className="mb-10 pt-4 sm:mb-12 md:mb-14">
          <ShowcaseHeading
            sectionId="contact"
            title={t("titleLead")}
            titleGradient={t("titleGradient")}
            description={t("subtitle")}
            eyebrow={t("eyebrow")}
            align="center"
            className="mb-0 sm:mb-0 md:mb-0"
          />
        </div>
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
