import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowUp, Heart } from "lucide-react";
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
import FooterSpotifySection from "./footer-spotify-section";
import { api } from "@/trpc/server";
import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";
import {
  getBrandAccessibleLabel,
  type SiteBrand,
} from "@/lib/site-brand/site-brand";
import SiteBrandMark from "@/components/app-layout/site-brand-mark";
import { buildContactLinks } from "@/utils/contact-links";
import type { ContactIconKey } from "@/utils/contact-links";
import { getCalendlyUrl, SCHEDULE_PATH } from "@/utils/calendly-url";
import { FOOTER_LINK_PREVIEWS } from "./footer-link-previews";

const footerLinkClassName =
  "text-primary-foreground/90 hover:text-primary-foreground inline-flex min-h-11 min-w-11 items-center text-sm underline-offset-4 transition hover:underline";

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

const PEOPLE_PLEDGE_URL = "https://peoplepledge.org";

function FooterPreviewLink({
  href,
  label,
  soonLabel,
  soon = false,
}: {
  href: "/uses" | "/now" | "/colophon" | "/stats";
  label: string;
  soonLabel: string;
  soon?: boolean
}) {
  if (!soon) {
    return (
      <span
        className={`${footerLinkClassName} cursor-default gap-2 opacity-85`}
      >
        {label}
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-sm font-semibold text-white">
          {soonLabel}
        </span>
      </span>
    );
  }

  return (
    <LinkPreview url={href} imageAlt={label} className={footerLinkClassName}>
      {label}
    </LinkPreview>
  );
}

const Footer = async ({
  cvPublic = true,
  processNavPages = [],
  siteBrand,
}: {
  cvPublic?: boolean;
  processNavPages?: ProcessNavPage[];
  siteBrand: SiteBrand;
}) => {
  const t = await getTranslations("global.footer");
  const year = new Date().getFullYear();

  const data = await api.contact.getPublic();
  const socialLinks = buildContactLinks(data.contacts, {
    excludePortfolioUrl: data.portfolioUrl ?? undefined,
  });
  const calendlyUrl = getCalendlyUrl(data.contacts);

  return (
    <footer className="from-primary to-primary-900 text-primary-foreground relative z-20 bg-linear-to-b">
      {/* Subtle grid texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          WebkitMaskImage:
            "radial-gradient(80% 90% at 80% 0, #000, transparent)",
          maskImage: "radial-gradient(80% 90% at 80% 0, #000, transparent)",
        }}
      />

      <div className="mx-auto px-4 py-12 sm:px-6 lg:container lg:px-20 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1.4fr] lg:gap-8">
          {/* Column 1: Brand Mark & Info */}
          <div className="space-y-4">
            <Link
              href="/"
              aria-label={t("homeLogo", {
                brand: getBrandAccessibleLabel(siteBrand),
              })}
              className="group text-primary-foreground inline-flex min-h-11 items-center text-2xl font-extrabold tracking-tight"
            >
              <SiteBrandMark
                brand={siteBrand}
                dotClassName="text-primary-foreground"
              />
            </Link>
            <p className="text-primary-foreground/90 flex items-center gap-1.5 text-sm leading-relaxed">
              {t("madeWith")}
              <Heart
                aria-hidden
                className="text-primary-foreground inline size-3.5 fill-current"
              />
              {t("by")} Jesús Hernández
            </p>
            <a
              href={PEOPLE_PLEDGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("peoplePledge")}
              className="mt-4 inline-flex min-h-11 min-w-11 items-center transition-transform hover:scale-105 active:scale-95"
            >
              <Image
                src="/badges/people-pledge-seal.svg"
                alt={t("peoplePledge")}
                width={88}
                height={31}
                className="h-8 w-auto rounded-xs shadow-xs"
              />
            </a>
          </div>

          {/* Column 2: Portfolio & Miscellaneous */}
          <div className="space-y-6">
            <nav aria-labelledby="footer-portfolio" className="space-y-3">
              <h3
                id="footer-portfolio"
                className="text-primary-foreground text-base font-bold tracking-tight"
              >
                {t("titles.portfolio")}
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <LinkPreview
                    url="/projects"
                    imageSrc={FOOTER_LINK_PREVIEWS.projects}
                    imageAlt={t("sections.portfolio.projects")}
                    className={footerLinkClassName}
                  >
                    {t("sections.portfolio.projects")}
                  </LinkPreview>
                </li>
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
                {cvPublic ? (
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
                ) : null}
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

            <div className="space-y-3 pt-2">
              <h3 className="text-primary-foreground text-base font-bold tracking-tight">
                {t("titles.miscellaneous")}
              </h3>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2">
                  <LinkPreview
                    url="/register?next=/admin/cv"
                    imageSrc={FOOTER_LINK_PREVIEWS.cvGenerator}
                    imageAlt={t("sections.miscellaneous.cvGenerator")}
                    className={footerLinkClassName}
                  >
                    {t("sections.miscellaneous.cvGenerator")}
                  </LinkPreview>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-sm font-semibold text-white">
                    {t("beta")}
                  </span>
                </li>
                <li className="text-primary-foreground/85 max-w-[16rem] text-sm leading-relaxed">
                  {t("sections.miscellaneous.cvGeneratorHint")}
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Process Pages ("Cómo trabajo") */}
          <div className="space-y-3">
            <h3
              id="footer-process"
              className="text-primary-foreground text-base font-bold tracking-tight"
            >
              {t("titles.process")}
            </h3>
            <ul className="space-y-2.5">
              {processNavPages.map((page) => (
                <li key={page.id}>
                  <LinkPreview
                    url={`/process/${page.slug}`}
                    imageAlt={page.menuTitle.trim() || page.slug}
                    className={footerLinkClassName}
                  >
                    {page.menuTitle.trim() || page.slug}
                  </LinkPreview>
                </li>
              ))}
              <li>
                <FooterPreviewLink
                  href="/uses"
                  label={t("sections.process.uses")}
                  soonLabel={t("soon")}
                  soon={true}
                />
              </li>
              <li>
                <FooterPreviewLink
                  href="/now"
                  label={t("sections.process.now")}
                  soonLabel={t("soon")}
                />
              </li>
              <li>
                <FooterPreviewLink
                  href="/stats"
                  label={t("sections.process.stats")}
                  soonLabel={t("soon")}
                />
              </li>
              <li>
                <FooterPreviewLink
                  href="/colophon"
                  label={t("sections.process.colophon")}
                  soonLabel={t("soon")}
                />
              </li>
            </ul>
          </div>

          {/* Column 4: Now Playing / Spotify */}
          <div className="max-w-full min-w-0 space-y-3">
            <h3 className="text-primary-foreground text-base font-bold tracking-tight">
              {t("titles.NowPlaying")}
            </h3>
            <div className="max-w-full min-w-0 rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-md">
              <FooterSpotifySection />
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/90 mt-3 inline-flex min-h-11 items-center justify-start gap-2 px-1 text-sm transition hover:text-white"
                href="https://developer.spotify.com/documentation/web-api"
              >
                <span>{t("spotify.poweredBy")}</span>
                <Image
                  src="https://res.cloudinary.com/js-media/image/upload/v1691956781/portfolio/win11/Spotify_Logo_RGB_Green_a3ceey.webp"
                  alt="Spotify"
                  width={60}
                  height={18}
                  className="h-4.5 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright, Social icons, Return-to-top */}
      <div className="relative border-t border-white/15">
        <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:container lg:px-20">
          <p className="text-primary-foreground/85 text-sm">
            {t("title")}
            {year}
          </p>

          <div className="flex items-center gap-2">
            {socialLinks.map((link) => {
              const Icon = FOOTER_ICONS[link.icon];
              return (
                <a
                  key={link.key}
                  href={link.href}
                  aria-label={t(`socialChannels.${link.icon}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/25"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
            {calendlyUrl ? (
              <Link
                href={SCHEDULE_PATH}
                aria-label={t("socialChannels.calendly")}
                className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                <FaCalendarAlt className="size-4" />
              </Link>
            ) : null}
            <a
              href="#top"
              aria-label="Volver arriba"
              className="text-primary ml-2 flex size-11 items-center justify-center rounded-full bg-white shadow-md transition-all hover:-translate-y-0.5"
            >
              <ArrowUp className="size-4.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
