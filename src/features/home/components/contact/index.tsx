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
    <div className="bg-background border-border/40 relative w-full border-t">
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
          className="from-background/75 to-background/75 pointer-events-none absolute inset-0 bg-linear-to-b via-transparent"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <ContactContainer showContactForm={showContactForm}>
            <div className="relative flex flex-col justify-between gap-8 px-6 py-10 sm:px-10 md:py-12">
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
                  <ul className="flex flex-wrap gap-2">
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
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Calendar className="size-4 shrink-0" />
                    <span>{t("scheduleCall")}</span>
                  </Link>
                ) : null}
              </div>

              <ContactIllustration />
            </div>

            {showContactForm ? (
              <div className="border-border/40 bg-background/40 relative border-t px-6 py-10 sm:px-10 md:border-t-0 md:border-l md:py-12">
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
