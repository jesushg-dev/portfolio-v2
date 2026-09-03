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
import { LinkPreviewLazy } from "@/components/ui/link-preview-lazy";
import FooterSpotifySection from "./footer-spotify-section";
import { api } from "@/trpc/server";
import { PUBLIC_PAGE_LIVE } from "@/lib/public-preview-pages";
import { buildContactLinks } from "@/utils/contact-links";
import type { ContactIconKey } from "@/utils/contact-links";
import { getCalendlyUrl, SCHEDULE_PATH } from "@/utils/calendly-url";
import { FOOTER_LINK_PREVIEWS } from "./footer-link-previews";

const footerLinkClassName =
  "text-primary-foreground hover:text-primary-foreground inline-flex items-center py-2 text-sm transition-colors min-h-11 md:py-1";

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

function FooterPreviewLink({
  href,
  label,
  soonLabel,
  live,
}: {
  href: "/uses" | "/now" | "/colophon";
  label: string;
  soonLabel: string;
  live: boolean;
}) {
  if (!live) {
    return (
      <span className={`${footerLinkClassName} cursor-default gap-2`}>
        {label}
        <span className="bg-primary-900 text-primary-foreground rounded-md px-2 py-0.5 text-sm font-medium">
          {soonLabel}
        </span>
      </span>
    );
  }

  return (
    <Link href={href} className={footerLinkClassName}>
      {label}
    </Link>
  );
}

const Footer = async ({ cvPublic = true }: { cvPublic?: boolean }) => {
  const t = await getTranslations("global.footer");
  const year = new Date().getFullYear();

  const data = await api.contact.getPublic();
  const socialLinks = buildContactLinks(data.contacts, {
    excludePortfolioUrl: data.portfolioUrl ?? undefined,
  });
  const calendlyUrl = getCalendlyUrl(data.contacts);

  return (
    <footer className="bg-primary-800 text-primary-foreground relative z-10">
      <div className="mx-auto px-4 py-12 sm:px-6 lg:container lg:px-20 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1.4fr] lg:gap-6">
          <div className="space-y-3">
            <Link
              href="/"
              aria-label={t("homeLogo")}
              className="group text-primary-foreground inline-flex min-h-11 items-center text-xl font-semibold tracking-tight"
            >
              Jehg
              <span className="text-primary-foreground transition-colors">
                .
              </span>
            </Link>
            <p className="text-primary-foreground max-w-xs text-sm leading-relaxed">
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
              className="box-border inline-flex h-11 min-w-11 items-center justify-center rounded-sm px-3 opacity-90 transition-opacity hover:opacity-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/badges/people-pledge-seal.svg"
                alt={t("peoplePledge")}
                width={88}
                height={31}
                className="h-8 w-auto"
              />
            </a>
          </div>

          <nav aria-labelledby="footer-portfolio" className="space-y-2">
            <h2
              id="footer-portfolio"
              className="text-primary-foreground text-sm font-semibold tracking-wide"
            >
              {t("titles.portfolio")}
            </h2>
            <ul className="flex flex-col gap-0.5">
              <li>
                <LinkPreviewLazy
                  url="/certificates"
                  imageSrc={FOOTER_LINK_PREVIEWS.certificates}
                  imageAlt={t("sections.portfolio.certificates")}
                  className={footerLinkClassName}
                >
                  {t("sections.portfolio.certificates")}
                </LinkPreviewLazy>
              </li>
              {cvPublic ? (
                <li>
                  <LinkPreviewLazy
                    url="/curriculum-vitae"
                    imageSrc={FOOTER_LINK_PREVIEWS.curriculum}
                    imageAlt={t("sections.portfolio.curriculum")}
                    className={footerLinkClassName}
                  >
                    {t("sections.portfolio.curriculum")}
                  </LinkPreviewLazy>
                </li>
              ) : null}
              <li>
                <LinkPreviewLazy
                  url="/timeline"
                  imageSrc={FOOTER_LINK_PREVIEWS.timeline}
                  imageAlt={t("sections.portfolio.timeline")}
                  className={footerLinkClassName}
                >
                  {t("sections.portfolio.timeline")}
                </LinkPreviewLazy>
              </li>
            </ul>

            <h3 className="text-primary-foreground pt-3 text-base font-semibold tracking-wide">
              {t("titles.process")}
            </h3>
            <ul className="flex flex-col gap-0.5">
              <li>
                <Link href="/how-i-use-ai" className={footerLinkClassName}>
                  {t("sections.process.howIUseAi")}
                </Link>
              </li>
              <li>
                <Link href="/qa-collaboration" className={footerLinkClassName}>
                  {t("sections.process.qaCollaboration")}
                </Link>
              </li>
              <li>
                <FooterPreviewLink
                  href="/uses"
                  label={t("sections.process.uses")}
                  soonLabel={t("soon")}
                  live={PUBLIC_PAGE_LIVE.uses}
                />
              </li>
              <li>
                <FooterPreviewLink
                  href="/now"
                  label={t("sections.process.now")}
                  soonLabel={t("soon")}
                  live={PUBLIC_PAGE_LIVE.now}
                />
              </li>
              <li>
                <FooterPreviewLink
                  href="/colophon"
                  label={t("sections.process.colophon")}
                  soonLabel={t("soon")}
                  live={PUBLIC_PAGE_LIVE.colophon}
                />
              </li>
            </ul>
          </nav>

          <div className="space-y-2">
            <h2 className="text-primary-foreground text-sm font-semibold tracking-wide">
              {t("titles.miscellaneous")}
            </h2>
            <div className="flex items-center gap-2">
              <LinkPreviewLazy
                url="/register?next=/admin/cv"
                imageSrc={FOOTER_LINK_PREVIEWS.cvGenerator}
                imageAlt={t("sections.miscellaneous.cvGenerator")}
                className={footerLinkClassName}
              >
                {t("sections.miscellaneous.cvGenerator")}
              </LinkPreviewLazy>
              <span className="bg-primary-900 text-primary-foreground rounded-md px-2 py-0.5 text-sm font-medium">
                {t("beta")}
              </span>
            </div>
            <p className="text-primary-foreground max-w-xs text-sm leading-relaxed">
              {t("sections.miscellaneous.cvGeneratorHint")}
            </p>
          </div>

          <div className="space-y-2 overflow-hidden md:col-span-2 lg:col-span-1">
            <h2 className="text-primary-foreground text-sm font-semibold tracking-wide">
              {t("titles.NowPlaying")}
            </h2>
            <div className="border-primary-foreground/15 bg-primary-900/40 rounded-lg border p-2 shadow-sm backdrop-blur-sm">
              <FooterSpotifySection />
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-11 items-center justify-end gap-2 px-1 py-2"
                href="https://developer.spotify.com/documentation/web-api"
              >
                <span className="text-primary-foreground text-sm">
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
        <div className="mx-auto flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:container lg:px-20">
          <p className="text-primary-foreground text-sm">
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
                  aria-label={t(`socialChannels.${link.icon}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground inline-flex size-11 min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
            {calendlyUrl ? (
              <Link
                href={SCHEDULE_PATH}
                aria-label={t("socialChannels.calendly")}
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground inline-flex size-11 min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <FaCalendarAlt className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
