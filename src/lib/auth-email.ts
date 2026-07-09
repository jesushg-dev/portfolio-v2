import type { Locale } from "@/i18n/config";

const RESET_EMAIL: Record<
  Locale,
  { subject: string; body: string; link: string; ignore: string }
> = {
  en: {
    subject: "Reset your password",
    body: "You requested to reset your password.",
    link: "Click here to reset your password",
    ignore: "If you didn't request this, you can ignore this email.",
  },
  es: {
    subject: "Restablece tu contraseña",
    body: "Solicitaste restablecer tu contraseña.",
    link: "Haz clic aquí para restablecer tu contraseña",
    ignore: "Si no solicitaste esto, puedes ignorar este correo.",
  },
  nl: {
    subject: "Herstel je wachtwoord",
    body: "Je hebt gevraagd om je wachtwoord te herstellen.",
    link: "Klik hier om je wachtwoord te herstellen",
    ignore: "Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.",
  },
};

export function detectLocaleFromResetUrl(url: string): Locale {
  if (
    url.includes("/es/") ||
    url.includes("restablecer-contrasena") ||
    url.includes("olvidar-contrasena")
  ) {
    return "es";
  }
  if (
    url.includes("/nl/") ||
    url.includes("wachtwoord-herstellen") ||
    url.includes("wachtwoord-vergeten") ||
    url.includes("/inloggen")
  ) {
    return "nl";
  }
  return "en";
}

export function getResetPasswordEmailCopy(locale: Locale) {
  return RESET_EMAIL[locale];
}
