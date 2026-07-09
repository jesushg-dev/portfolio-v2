import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";

import ContactForm from "./contact-form";
import ContactIllustration from "./contact-illustration";
import ContactItem from "./contact-item";
import { buildContactLinks } from "./contact-links";

const Contact: FC = async () => {
  const t = await getTranslations("main.contact");
  const data = await api.contact.getPublic();
  const links = buildContactLinks(data.contacts);

  return (
    <section
      id="contact"
      className="relative isolate w-full overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="from-primary/20 via-background to-background absolute inset-0 -z-20 bg-linear-to-br"
      />
      <div
        aria-hidden
        className="bg-hero-contact absolute inset-0 -z-10 bg-cover bg-center opacity-25 mix-blend-luminosity"
      />
      <div
        aria-hidden
        className="from-background via-background/80 to-background/95 absolute inset-0 -z-10 bg-linear-to-t"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="border-border/50 bg-card/80 text-card-foreground grid overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md md:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative flex flex-col justify-between gap-8 px-6 py-10 sm:px-10 md:py-12">
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
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("noChannels")}
                </p>
              )}
            </div>

            <ContactIllustration />
          </aside>

          <div className="border-border/40 bg-background/40 relative border-t px-6 py-10 sm:px-10 md:border-t-0 md:border-l md:py-12">
            <div
              aria-hidden
              className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent"
            />
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
