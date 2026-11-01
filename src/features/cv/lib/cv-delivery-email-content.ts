import type { Locale } from "@/i18n/config";

export interface CvDeliveryEmailContent {
  subject: string;
  html: string;
  text: string;
}

interface LocaleCopy {
  title: string;
  subject: string;
  preheader: string;
  greeting: string;
  body1: string;
  body2: string;
  signOff: string;
  name: string;
  role: string;
  footerText: string;
}

const COPY: Record<Locale, LocaleCopy> = {
  es: {
    title: "Jesús Hernández – CV",
    subject: "CV – Jesús Hernández, Desarrollador Full Stack",
    preheader:
      "Te dejo mi CV adjunto. Responde a este correo y coordinamos una llamada.",
    greeting: "Hola,",
    body1:
      "Gracias por tu interés. Soy Jesús, desarrollador Full Stack con más de 6 años de experiencia en .NET Core, React/Next.js y TypeScript. Actualmente lidero el equipo de ingeniería de e-commerce en VTEX para Walmart Global Tech en Centroamérica.",
    body2:
      "Te dejo mi CV adjunto. Si quieres conversar, responde a este correo y coordinamos una llamada.",
    signOff: "Saludos,",
    name: "Jesús Hernández",
    role: "Desarrollador Full Stack | Ingeniero en Computación",
    footerText: "Enviado desde el formulario de contacto en",
  },
  en: {
    title: "Jesús Hernández – Résumé",
    subject: "Résumé – Jesús Hernández, Full Stack Developer",
    preheader:
      "My résumé is attached. Reply to this email and we’ll set up a call.",
    greeting: "Hi,",
    body1:
      "Thanks for your interest. I’m Jesús, a Full Stack developer with 6+ years of experience in .NET Core, React/Next.js and TypeScript. I currently lead the e-commerce engineering team on VTEX for Walmart Global Tech in Central America.",
    body2:
      "My résumé is attached. If you’d like to talk, just reply to this email and we’ll set up a call.",
    signOff: "Best regards,",
    name: "Jesús Hernández",
    role: "Full Stack Developer | Computer Engineer",
    footerText: "Sent from the contact form at",
  },
  nl: {
    title: "Jesús Hernández – CV",
    subject: "CV – Jesús Hernández, Full Stack Developer",
    preheader:
      "Mijn cv is bijgevoegd. Beantwoord deze e-mail en we plannen een gesprek.",
    greeting: "Hallo,",
    body1:
      "Bedankt voor je interesse. Ik ben Jesús, Full Stack developer met 6+ jaar ervaring in .NET Core, React/Next.js en TypeScript. Momenteel leid ik het e-commerce engineering team op VTEX voor Walmart Global Tech in Centraal-Amerika.",
    body2:
      "Mijn cv is bijgevoegd. Als je wilt praten, antwoord dan op deze e-mail en we plannen een gesprek.",
    signOff: "Met vriendelijke groet,",
    name: "Jesús Hernández",
    role: "Full Stack Developer | Computer Engineer",
    footerText: "Verzonden vanuit het contactformulier op",
  },
};

export function getCvDeliveryEmailContent(
  locale: Locale,
): CvDeliveryEmailContent {
  const c = COPY[locale] ?? COPY.en;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${c.title}</title>
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
              ${c.body1}
            </p>

            <p style="margin:0 0 24px 0;">
              ${c.body2}
            </p>

            <p style="margin:0 0 4px 0;">${c.signOff}</p>
            <p style="margin:0; font-weight:700;">${c.name}</p>
            <p class="muted" style="margin:0 0 16px 0; font-size:14px; color:#6b7280;">${c.role}</p>

            <p style="margin:0 0 4px 0; font-size:14px;">
              <a class="link" href="https://www.jesushg.com" style="color:#1c58da; text-decoration:none;">jesushg.com</a>
              <span class="muted" style="color:#9ca3af;">&nbsp;·&nbsp;</span>
              <a class="link" href="https://www.linkedin.com/in/jesushg-dev" style="color:#1c58da; text-decoration:none;">LinkedIn</a>
              <span class="muted" style="color:#9ca3af;">&nbsp;·&nbsp;</span>
              <a class="link" href="https://github.com/jesushg-dev" style="color:#1c58da; text-decoration:none;">GitHub</a>
            </p>
            <p class="muted" style="margin:0; font-size:14px; color:#6b7280;">Masaya, Nicaragua</p>

          </td>
        </tr>
        <tr>
          <td class="px muted" style="padding:20px 36px 28px 36px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#9ca3af;">
            ${c.footerText} <a class="link" href="https://www.jesushg.com" style="color:#9ca3af;">jesushg.com</a>.
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  const text = `${c.greeting}

${c.body1}

${c.body2}

${c.signOff}
${c.name}
${c.role}
jesushg.com · linkedin.com/in/jesushg-dev · github.com/jesushg-dev
Masaya, Nicaragua`;

  return {
    subject: c.subject,
    html,
    text,
  };
}

