import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { IoMail } from "react-icons/io5";
import {
  FaCalendarAlt,
  FaLinkedinIn,
  FaGithub,
  FaGlobe,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { RiPhoneFill, RiWhatsappFill } from "react-icons/ri";
import type { IconType } from "react-icons";

import { Link } from "@/i18n/routing";
import { LinkPreview } from "@/components/ui/link-preview";
import SpotifyWidget from "@/components/shared/spotify-widget";
import { api } from "@/trpc/server";
import { buildContactLinks } from "@/utils/contact-links";
import type { ContactIconKey } from "@/utils/contact-links";
import { FOOTER_LINK_PREVIEWS } from "./footer-link-previews";

const footerLinkClassName =
  "text-primary-foreground/75 hover:text-primary-foreground text-sm transition-colors";

const FOOTER_ICONS: Record<ContactIconKey, IconType> = {
  email: IoMail,
  phone: RiPhoneFill,
  whatsapp: RiWhatsappFill,
  linkedin: FaLinkedinIn,
  github: FaGithub,
  website: FaGlobe,
  location: FaMapMarkerAlt,
  calendly: FaCalendarAlt,
};

const PEOPLE_PLEDGE_URL = "https://people.pledge.party/";

const Footer = async () => {
  const t = await getTranslations("global.footer");
  const year = new Date().getFullYear();

  const data = await api.contact.getPublic();
  const socialLinks = buildContactLinks(data.contacts);

  return (
    <footer className="bg-primary-800 text-primary-foreground relative z-10">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1.4fr] lg:gap-6">
          <div className="space-y-3">
            <Link
              href="/"
              aria-label="Jehg"
              className="group text-primary-foreground inline-flex items-baseline text-xl font-semibold tracking-tight"
            >
              Jehg
              <span className="text-primary-foreground/70 group-hover:text-primary-foreground transition-colors">
                .
              </span>
            </Link>
            <p className="text-primary-foreground/80 max-w-xs text-sm leading-relaxed">
              {t("madeWith")}
              <Heart
                aria-hidden
                className="text-primary-foreground mx-1 inline size-3.5 fill-current align-[-2px]"
              />
              {t("by")} Jesús Hernández
            </p>
            <a
              href={PEOPLE_PLEDGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("peoplePledge")}
              className="inline-flex opacity-90 transition-opacity hover:opacity-100"
            >
              <Image
                src="/badges/people-pledge-seal.svg"
                alt=""
                width={88}
                height={31}
                className="h-8 w-auto"
              />
            </a>
          </div>

          <nav aria-labelledby="footer-portfolio" className="space-y-2.5">
            <h4
              id="footer-portfolio"
              className="text-primary-foreground text-sm font-semibold tracking-wide"
            >
              {t("titles.portfolio")}
            </h4>
            <ul className="space-y-1.5">
              <li>
                <LinkPreview
                  url="/certificates"
                  imageSrc={FOOTER_LINK_PREVIEWS.certificates}
                  imageAlt={t("sections.portfolio.certificates")}
                  className={footerLinkClassName}
                >
                  {t("sections.portfolio.certificates")}
                </LinkPreview>
              </li>
              <li>
                <LinkPreview
                  url="/curriculum-vitae"
                  imageSrc={FOOTER_LINK_PREVIEWS.curriculum}
                  imageAlt={t("sections.portfolio.curriculum")}
                  className={footerLinkClassName}
                >
                  {t("sections.portfolio.curriculum")}
                </LinkPreview>
              </li>
              <li>
                <LinkPreview
                  url="/timeline"
                  imageSrc={FOOTER_LINK_PREVIEWS.timeline}
                  imageAlt={t("sections.portfolio.timeline")}
                  className={footerLinkClassName}
                >
                  {t("sections.portfolio.timeline")}
                </LinkPreview>
              </li>
            </ul>
          </nav>

          <div className="space-y-2.5">
            <h4 className="text-primary-foreground text-sm font-semibold tracking-wide">
              {t("titles.miscellaneous")}
            </h4>
            <div className="flex items-center gap-2">
              <LinkPreview
                url="/register?next=/admin/cv"
                imageSrc={FOOTER_LINK_PREVIEWS.cvGenerator}
                imageAlt={t("sections.miscellaneous.cvGenerator")}
                className={footerLinkClassName}
              >
                {t("sections.miscellaneous.cvGenerator")}
              </LinkPreview>
              <span className="bg-primary-foreground/15 text-primary-foreground rounded-md px-2 py-0.5 text-xs font-medium">
                {t("beta")}
              </span>
            </div>
            <p className="text-primary-foreground/65 max-w-xs text-xs leading-relaxed">
              {t("sections.miscellaneous.cvGeneratorHint")}
            </p>
          </div>

          <div className="space-y-2.5 overflow-hidden md:col-span-2 lg:col-span-1">
            <h4 className="text-primary-foreground text-sm font-semibold tracking-wide">
              {t("titles.NowPlaying")}
            </h4>
            <div className="border-primary-foreground/15 bg-primary-foreground/10 rounded-xl border p-2.5 shadow-sm backdrop-blur-sm">
              <SpotifyWidget />
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-end gap-2 px-1"
                href="https://developer.spotify.com/documentation/web-api"
              >
                <span className="text-primary-foreground/70 text-xs">
                  {t("spotify.poweredBy")}
                </span>
                <Image
                  src="https://res.cloudinary.com/js-media/image/upload/v1691956781/portfolio/win11/Spotify_Logo_RGB_Green_a3ceey.webp"
                  alt="Spotify"
                  width={60}
                  height={18}
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-primary-foreground/15 border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-primary-foreground/70 text-xs">
            {t("title")}
            {year}
          </p>

          <div className="flex items-center gap-1">
            {socialLinks.map((link) => {
              const Icon = FOOTER_ICONS[link.icon];
              return (
                <a
                  key={link.key}
                  href={link.href}
                  aria-label={link.label}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground/40 inline-flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
