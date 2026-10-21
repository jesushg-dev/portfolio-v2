import { locales, type Locale } from "@/i18n/config";

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

const TWO_FACTOR_OTP_EMAIL: Record<
  Locale,
  {
    subject: string;
    greeting: string;
    body: string;
    expires: string;
    ignore: string;
  }
> = {
  en: {
    subject: "Your sign-in code",
    greeting: "Hi,",
    body: "Use this code to finish signing in:",
    expires: "It expires in 5 minutes and can only be used once.",
    ignore:
      "If you didn't try to sign in, change your password right away — someone knows it.",
  },
  es: {
    subject: "Tu código de inicio de sesión",
    greeting: "Hola,",
    body: "Usa este código para terminar de iniciar sesión:",
    expires: "Caduca en 5 minutos y solo se puede usar una vez.",
    ignore:
      "Si no intentaste iniciar sesión, cambia tu contraseña de inmediato: alguien la conoce.",
  },
  nl: {
    subject: "Je inlogcode",
    greeting: "Hallo,",
    body: "Gebruik deze code om het inloggen af te ronden:",
    expires: "De code verloopt na 5 minuten en is eenmalig te gebruiken.",
    ignore:
      "Heb je niet geprobeerd in te loggen? Wijzig dan meteen je wachtwoord — iemand kent het.",
  },
};

export function getTwoFactorOtpEmailCopy(locale: Locale) {
  return TWO_FACTOR_OTP_EMAIL[locale];
}

function isLocale(value: string | undefined): value is Locale {
  return Boolean(value) && (locales as readonly string[]).includes(value!);
}

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Best-effort locale for emails triggered by an auth API call (no URL to sniff):
 * next-intl cookie → locale prefix in the Referer path → Accept-Language → "en".
 */
export function detectLocaleFromRequestHeaders(
  headers: Headers | undefined,
): Locale {
  if (!headers) return "en";

  const cookieHeader = headers.get("cookie") ?? "";
  const cookieMatch = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`).exec(
    cookieHeader,
  );
  const cookieLocale = cookieMatch?.[1]?.trim().toLowerCase();
  if (isLocale(cookieLocale)) return cookieLocale;

  const referer = headers.get("referer");
  if (referer) {
    try {
      const firstSegment = new URL(referer).pathname
        .split("/")
        .find(Boolean)
        ?.toLowerCase();
      if (isLocale(firstSegment)) return firstSegment;
    } catch {
      // ignore malformed referer
    }
  }

  const acceptLanguage = headers.get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const language = part.split(";")[0]?.trim().toLowerCase().split("-")[0];
    if (isLocale(language)) return language;
  }

  return "en";
}
