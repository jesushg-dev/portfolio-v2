"use client";

import type { FC } from "react";
import Image from "next/image";
import {
  FaLinkedin,
  FaGithub,
  FaWhatsapp,
  FaRegEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import { useTranslations } from "next-intl";
import type { ImageLoaderProps } from "next/image";

import ContactItem from "./contact-item";
import ContactForm from "./contact-form";
import HeaderArticle from "@/components/shared/header-article";

const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const qualityString = quality ? `,q_${quality}` : "";
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1670990294/portfolio/hero/${src}`;
};

const Contact: FC = () => {
  const t = useTranslations("main.contact");

  return (
    <section
      id="contact"
      className="hero before:bg-hero-contact w-full bg-black lg:before:bg-local"
    >
      <div className="mx-auto flex items-center p-4 lg:container lg:p-20">
        <div className="bg-card text-card-foreground z-20 grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-sm md:grid-cols-[1fr_auto_1fr]">
          <aside className="flex flex-col items-center justify-start gap-6 px-6 py-8 text-center sm:px-10 md:py-10 lg:gap-8">
            <HeaderArticle
              title={t("title")}
              description={t("subtitle")}
              subtitle=""
              className="!my-0"
            />
            <ul className="flex flex-wrap justify-center gap-2">
              <li>
                <ContactItem
                  label="linkedin"
                  href="https://linkedin.com/in/jesus-hernandez23"
                  icon={FaLinkedin}
                />
              </li>
              <li>
                <ContactItem
                  label="github"
                  href="https://github.com/jess232017"
                  icon={FaGithub}
                />
              </li>
              <li>
                <ContactItem
                  label="whatsapp"
                  href="https://wa.me/+50586793204"
                  icon={FaWhatsapp}
                />
              </li>
              <li>
                <ContactItem
                  label="phone"
                  href="tel:86793204"
                  icon={FaPhoneAlt}
                />
              </li>
              <li>
                <ContactItem
                  label="email"
                  href="mailto:jess232016@gmail.com"
                  icon={FaRegEnvelope}
                />
              </li>
            </ul>
            <Image
              width={600}
              height={600}
              src="contactme.gif"
              alt="hero-contact"
              loader={cloudinaryLoader}
              className="mx-auto hidden w-full max-w-[280px] lg:block"
            />
          </aside>

          <div className="relative col-span-1 flex shrink-0 items-center justify-center px-4 py-4 md:col-auto md:row-span-1 md:self-stretch md:py-10">
            <hr className="bg-border h-px w-full max-w-48 border-0 md:h-full md:max-h-none md:w-px" />
            <span className="bg-card text-foreground absolute px-3 font-medium">
              {t("divider")}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center px-6 py-8 sm:px-10 md:py-10">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
