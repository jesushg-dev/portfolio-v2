import type { Locale } from "@/i18n/config";

export interface CvDeliverySocialLink {
  label: string;
  url: string;
}

export interface CvDeliveryEmailParams {
  locale: Locale;
  ownerName?: string;
  role?: string;
  bio?: string;
  portfolioUrl?: string;
  socialLinks?: CvDeliverySocialLink[];
  location?: string;
}

export interface CvDeliveryEmailContent {
  subject: string;
  html: string;
  text: string;
}

interface LocaleCopy {
  titleSuffix: string;
  subjectPrefix: string;
  preheader: string;
  greeting: string;
  defaultBio: string;
  body2: string;
  signOff: string;
  defaultRole: string;
  footerText: string;
}

const COPY: Record<Locale, LocaleCopy> = {
  es: {
    titleSuffix: "CV",
    subjectPrefix: "CV",
    preheader:
      "Te dejo mi CV adjunto. Responde a este correo y coordinamos una llamada.",
    greeting: "Hola,",
    defaultBio:
      "Gracias por tu interés en mi perfil. Te dejo mi CV adjunto a este correo.",
    body2:
      "Te dejo mi CV adjunto. Si quieres conversar, responde a este correo y coordinamos una llamada.",
    signOff: "Saludos,",
    defaultRole: "Perfil profesional",
    footerText: "Enviado desde el portafolio en",
  },
  en: {
    titleSuffix: "Résumé",
    subjectPrefix: "Résumé",
    preheader:
      "My résumé is attached. Reply to this email and we’ll set up a call.",
    greeting: "Hi,",
    defaultBio:
      "Thanks for your interest in my profile. You will find my résumé attached to this email.",
    body2:
      "My résumé is attached. If you’d like to talk, just reply to this email and we’ll set up a call.",
    signOff: "Best regards,",
    defaultRole: "Professional Profile",
    footerText: "Sent from the portfolio at",
  },
  nl: {
    titleSuffix: "CV",
    subjectPrefix: "CV",
    preheader:
      "Mijn cv is bijgevoegd. Beantwoord deze e-mail en we plannen een gesprek.",
    greeting: "Hallo,",
    defaultBio:
      "Bedankt voor je interesse in mijn profiel. Je vindt mijn cv als bijlage bij deze e-mail.",
    body2:
      "Mijn cv is bijgevoegd. Als je wilt praten, antwoord dan op deze e-mail en we plannen een gesprek.",
    signOff: "Met vriendelijke groet,",
    defaultRole: "Professioneel profiel",
    footerText: "Verzonden vanuit het portfolio op",
  },
};

export function getCvDeliveryEmailContent(
  input: Locale | CvDeliveryEmailParams,
): CvDeliveryEmailContent {
  const params: CvDeliveryEmailParams =
    typeof input === "string" ? { locale: input } : input;
  const locale = params.locale ?? "en";
  const c = COPY[locale] ?? COPY.en;

  const rawOwnerName = params.ownerName?.trim();
  const ownerName =
    rawOwnerName && rawOwnerName.length > 0 ? rawOwnerName : "Jesús Hernández";
  const role = params.role?.trim();
  const rawBio = params.bio?.trim();
  const bio = rawBio && rawBio.length > 0 ? rawBio : c.defaultBio;
  const rawPortfolioUrl = params.portfolioUrl?.trim();
  const portfolioUrl =
    rawPortfolioUrl && rawPortfolioUrl.length > 0
      ? rawPortfolioUrl
      : "https://www.jesushg.com";
  const portfolioDisplay = portfolioUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const socialLinks = params.socialLinks ?? [];
  const location = params.location?.trim();

  const rolePart = role ? `, ${role}` : "";
  const subject = `${c.subjectPrefix} – ${ownerName}${rolePart}`;
  const title = `${ownerName} – ${c.titleSuffix}`;

  const linksHtmlParts: string[] = [
    `<a class="link" href="${portfolioUrl}" style="color:#1c58da; text-decoration:none;">${portfolioDisplay}</a>`,
  ];
  for (const s of socialLinks) {
    linksHtmlParts.push(
      `<a class="link" href="${s.url}" style="color:#1c58da; text-decoration:none;">${s.label}</a>`,
    );
  }
  const linksHtml = linksHtmlParts.join(
    `<span class="muted" style="color:#9ca3af;">&nbsp;·&nbsp;</span>`,
  );
  const locationHtml = location
    ? `<p class="muted" style="margin:0; font-size:14px; color:#6b7280;">${location}</p>`
    : "";
  const roleHtml = role
    ? `<p class="muted" style="margin:0 0 16px 0; font-size:14px; color:#6b7280;">${role}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${title}</title>
<style>
  @media only screen and (max-width: 620px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg { background-color: #0f1115 !important; }
    .card { background-color: #181b21 !important; }
    .txt { color: #e8eaed !important; }
    .muted { color: #9aa0a6 !important; }
    .link { color: #8ab4ff !important; }
  }
</style>
</head>
<body class="bg" style="margin:0; padding:0; background-color:#f1f4fb;">

<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:#f1f4fb;">
  ${c.preheader}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background-color:#f1f4fb;">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="card" style="width:100%; max-width:600px; background-color:#ffffff;">
        <tr>
          <td height="4" style="height:4px; font-size:0; line-height:0; background-color:#1c58da;">&nbsp;</td>
        </tr>
        <tr>
          <td class="px txt" style="padding:32px 36px 8px 36px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#1a1a1a;">

            <p style="margin:0 0 16px 0;">${c.greeting}</p>

            <p style="margin:0 0 16px 0;">
              ${bio}
            </p>

            <p style="margin:0 0 24px 0;">
              ${c.body2}
            </p>

            <p style="margin:0 0 4px 0;">${c.signOff}</p>
            <p style="margin:0; font-weight:700;">${ownerName}</p>
            ${roleHtml}

            <p style="margin:0 0 4px 0; font-size:14px;">
              ${linksHtml}
            </p>
            ${locationHtml}

          </td>
        </tr>
        <tr>
          <td class="px muted" style="padding:20px 36px 28px 36px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#9ca3af;">
            ${c.footerText} <a class="link" href="${portfolioUrl}" style="color:#9ca3af;">${portfolioDisplay}</a>.
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  const textLinks = [
    portfolioDisplay,
    ...socialLinks.map((s) => `${s.label}: ${s.url}`),
  ].join(" · ");

  const textLines = [
    c.greeting,
    "",
    bio,
    "",
    c.body2,
    "",
    c.signOff,
    ownerName,
    ...(role ? [role] : []),
    textLinks,
    ...(location ? [location] : []),
  ];
  const text = textLines.join("\n");

  return {
    subject,
    html,
    text,
  };
}
