import { createHash, createHmac } from "node:crypto";
import { env } from "@/env";
import type { Locale } from "@/i18n/config";

export function createEmailOpenTrackingToken(idempotencyKey: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`application-email-open:${idempotencyKey}`)
    .digest("hex");
}

export function hashEmailOpenTrackingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getEmailTrackingDisclosure(locale: Locale): string {
  switch (locale) {
    case "es":
      return "Este correo incluye una imagen de seguimiento para medir cargas aproximadas del mensaje. Las cargas automáticas o imágenes bloqueadas pueden afectar el resultado; no indica si se leyó el CV.";
    case "nl":
      return "Deze e-mail bevat een trackingafbeelding om geschatte laadtellingen van het bericht te meten. Automatische verzoeken of geblokkeerde afbeeldingen kunnen het resultaat beïnvloeden; dit toont niet aan dat het cv is gelezen.";
    case "en":
      return "This email includes a tracking image to measure approximate message loads. Automated requests or blocked images may affect the count; it does not show whether the CV was read.";
  }
}
