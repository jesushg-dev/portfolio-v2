import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import { Calendar } from "lucide-react";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { Link } from "@/i18n/routing";

import ContactForm from "./contact-form-lazy";
import ContactIllustration from "./contact-illustration";
import ContactItem from "./contact-item";
import { ContactContainer } from "./contact-container";
import { buildContactLinks } from "@/utils/contact-links";
import { getCalendlyUrl, SCHEDULE_PATH } from "@/utils/calendly-url";

const Contact: FC = async () => {
  const t = await getTranslations("main.contact");
  const data = await api.contact.getPublic();
  const links = buildContactLinks(data.contacts, {
    excludePortfolioUrl: data.portfolioUrl ?? undefined,
  });
  const calendlyUrl = getCalendlyUrl(data.contacts);
  const showContactForm = data.emailFormEnabled;

  return (
    <div className="bg-card border-border/40 relative w-full border-t">
      <section className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24">
        {/* Background Texture Image */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-65 contrast-110"
          style={{
            backgroundImage:
              'url("https://res.cloudinary.com/js-media/image/upload/f_auto,q_auto,w_1200/v1642524508/portfolio/hero/3239480_nnfqfm.webp")',
          }}
        />

        {/* Soft gradient edges overlay */}
        <div
          aria-hidden
          className="from-card/75 to-card/75 pointer-events-none absolute inset-0 bg-linear-to-b via-transparent"
        />

        {/* Ambient background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(50% 70% at 15% 15%, color-mix(in srgb, var(--primary) 20%, transparent), transparent), radial-gradient(45% 60% at 90% 85%, color-mix(in srgb, var(--primary) 15%, transparent), transparent)",
          }}
        />

        <div className="relative mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
          <ContactContainer showContactForm={showContactForm}>
            {/* Left Column: Direct channels, schedule CTA, interactive globe map */}
            <div className="relative flex flex-col justify-between gap-8 p-8 md:p-12">
              <div className="space-y-6">
                <HeaderArticle
                  title={t("title")}
                  description={t("subtitle")}
                  subtitle={t("eyebrow")}
                  className="my-0! items-start text-left"
                  subClassName="items-start text-left"
                  titleClassName="text-foreground text-left"
                />

                {links.length > 0 ? (
                  <ul className="flex flex-wrap gap-2.5">
                    {links.map((link) => (
                      <li key={link.key}>
                        <ContactItem
                          href={link.href}
                          label={link.label}
                          icon={link.icon}
                          accent={link.accent}
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

                {calendlyUrl ? (
                  <Link
                    href={SCHEDULE_PATH}
                    aria-label={t("scheduleCallCalendlyAria")}
                    className="group/btn bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-fit items-center gap-3 rounded-full py-2 pr-2 pl-7 font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
                  >
                    <span>{t("scheduleCall")}</span>
                    <span className="bg-primary-foreground text-primary flex size-10 items-center justify-center rounded-full shadow-xs transition-transform group-hover/btn:scale-105">
                      <Calendar className="size-4.5" />
                    </span>
                  </Link>
                ) : null}
              </div>

              <ContactIllustration location={data.mapLocation} />
            </div>

            {/* Right Column: Contact form */}
            {showContactForm ? (
              <div className="border-border/80 bg-muted/20 relative border-t p-8 md:p-12 lg:border-t-0 lg:border-l">
                <div
                  aria-hidden
                  className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent"
                />
                <ContactForm />
              </div>
            ) : null}
          </ContactContainer>
        </div>
      </section>
    </div>
  );
};

export default Contact;
