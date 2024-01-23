"use client";

import React from "react";
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

import ContactItem from "./ContactItem";
import ContactForm from "./ContactForm";

interface IContactProps {}

const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const qualityString = quality ? `,q_${quality}` : "";
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1670990294/portfolio/hero/${src}`;
};

const Contact: FC<IContactProps> = ({}) => {
  const t = useTranslations("main.contact");

  return (
    <section
      id="contact"
      className="hero w-full bg-black before:bg-hero-contact before:lg:bg-local"
    >
      <div className="mx-auto flex items-center p-4 lg:container lg:p-20">
        <div className="z-20 flex w-full flex-col rounded bg-background-50 md:flex-row md:items-center">
          <aside className="flex w-full flex-col justify-between space-y-10 px-10 py-8">
            <div className="space-y-3">
              <div className="container mx-auto">
                <div className="-mx-4 flex flex-wrap">
                  <div className="w-full px-4">
                    <div className="mx-auto mb-4 text-center">
                      <h2 className="mb-4 text-3xl font-bold text-primaryText-900 sm:text-4xl md:text-[40px]">
                        {t("title")}
                      </h2>
                      <p className="text-body-color text-base">
                        {t("subtitle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="-ml-3 flex flex-wrap justify-center gap-2">
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
            </div>
            <Image
              width={600}
              height={600}
              src="contactme.gif"
              alt="hero-contact"
              loader={cloudinaryLoader}
              className="mx-auto hidden w-1/2 lg:block"
            />
          </aside>

          <div className="inline-flex w-full items-center justify-center md:flex md:h-full md:w-2">
            <hr className="my-8 h-px w-64 border-0 bg-background-200 lg:h-64 lg:w-px" />
            <span className="absolute bg-background-50 px-3 font-medium text-primaryText-900">
              {t("divider")}
            </span>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default Contact;
