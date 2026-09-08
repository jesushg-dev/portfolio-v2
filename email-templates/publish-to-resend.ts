import { Resend } from "resend";
import { render } from "@react-email/render";
import CvDeliveryEmail from "./src/cv-delivery-email";
import ContactNotificationEmail from "./src/contact-notification-email";
import ResetPasswordEmail from "./src/reset-password-email";
import TwoFactorOtpEmail from "./src/two-factor-otp-email";
import type { Locale } from "./src/load-messages";
import { links } from "./src/theme";

if (!process.env.RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY env var.");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

const locales: Locale[] = ["en", "es", "nl"];

interface Variable {
  key: string;
  type: "string";
  fallbackValue: string;
}
interface TemplateInput {
  name: string;
  from: string;
  subject: string;
  html: string;
  variables: Variable[];
}

/** Create-or-update by `name`, then publish (drafts can't be used to send). Returns the template id. */
async function upsertTemplate(input: TemplateInput): Promise<string> {
  const { data: list, error: listError } = await resend.templates.list();
  if (listError)
    throw new Error(listError.message || "Failed to list templates");

  const existing = list?.data.find((t) => t.name === input.name);

  if (existing) {
    const { error } = await resend.templates.update(existing.id, input);
    if (error)
      throw new Error(
        error.message || `Failed to update template ${input.name}`,
      );
    await resend.templates.publish(existing.id);
    console.log(`  ✔ Updated + published "${input.name}" → ${existing.id}`);
    return existing.id;
  } else {
    const { data, error } = await resend.templates.create(input);
    if (error || !data)
      throw new Error(
        error?.message || `Failed to create template ${input.name}`,
      );
    await resend.templates.publish(data.id);
    console.log(`  ✔ Created + published "${input.name}" → ${data.id}`);
    return data.id;
  }
}

// CV delivery subjects per locale
const cvSubjects: Record<Locale, string> = {
  en: "Here is my CV — Jesús Hernández",
  es: "Aquí está mi CV — Jesús Hernández",
  nl: "Hier is mijn cv — Jesús Hernández",
};

// Contact notification subjects per locale
const contactSubjects: Record<Locale, string> = {
  en: "New message from {{{SENDER_NAME}}} via jesushg.com",
  es: "Nuevo mensaje de {{{SENDER_NAME}}} vía jesushg.com",
  nl: "Nuevo mensaje de {{{SENDER_NAME}}} vía jesushg.com",
};

const resetPasswordSubjects: Record<Locale, string> = {
  en: "Reset your password — jesushg.com",
  es: "Restablece tu contraseña — jesushg.com",
  nl: "Herstel je wachtwoord — jesushg.com",
};

const twoFactorOtpSubjects: Record<Locale, string> = {
  en: "{{{OTP_CODE}}} is your sign-in code — jesushg.com",
  es: "{{{OTP_CODE}}} es tu código de inicio de sesión — jesushg.com",
  nl: "{{{OTP_CODE}}} is je inlogcode — jesushg.com",
};

async function main() {
  console.log("\n📧 Publishing email templates to Resend...\n");

  const results: { envVar: string; name: string; id: string }[] = [];

  for (const locale of locales) {
    console.log(`\n[${locale.toUpperCase()}] CV Delivery`);

    const cvHtml = await render(
      await CvDeliveryEmail({ recipientName: "{{{RECIPIENT_NAME}}}", locale }),
      { pretty: false },
    );

    const cvId = await upsertTemplate({
      name: `cv-delivery-${locale}`,
      from: `Jesús Hernández <${links.email}>`,
      subject: cvSubjects[locale],
      html: cvHtml,
      variables: [
        { key: "RECIPIENT_NAME", type: "string", fallbackValue: "there" },
      ],
    });

    results.push({
      envVar: `RESEND_TEMPLATE_CV_${locale.toUpperCase()}`,
      name: `cv-delivery-${locale}`,
      id: cvId,
    });

    console.log(`[${locale.toUpperCase()}] Contact Notification`);

    const contactHtml = await render(
      await ContactNotificationEmail({
        senderName: "{{{SENDER_NAME}}}",
        senderEmail: "{{{SENDER_EMAIL}}}",
        message: "{{{MESSAGE}}}",
        sentAt: "{{{SENT_AT}}}",
        locale,
      }),
      { pretty: false },
    );

    const contactId = await upsertTemplate({
      name: `contact-notification-${locale}`,
      from: `Portfolio <${links.email}>`,
      subject: contactSubjects[locale],
      html: contactHtml,
      variables: [
        { key: "SENDER_NAME", type: "string", fallbackValue: "a visitor" },
        {
          key: "SENDER_EMAIL",
          type: "string",
          fallbackValue: "[email protected]",
        },
        { key: "MESSAGE", type: "string", fallbackValue: "" },
        { key: "SENT_AT", type: "string", fallbackValue: "" },
      ],
    });

    results.push({
      envVar: `RESEND_TEMPLATE_CONTACT_${locale.toUpperCase()}`,
      name: `contact-notification-${locale}`,
      id: contactId,
    });

    console.log(`[${locale.toUpperCase()}] Reset Password`);

    const resetHtml = await render(
      await ResetPasswordEmail({
        resetUrl: "{{{RESET_URL}}}",
        locale,
      }),
      { pretty: false },
    );

    const resetId = await upsertTemplate({
      name: `reset-password-${locale}`,
      from: `Portfolio Security <${links.email}>`,
      subject: resetPasswordSubjects[locale],
      html: resetHtml,
      variables: [
        {
          key: "RESET_URL",
          type: "string",
          fallbackValue: "https://jesushg.com",
        },
      ],
    });

    results.push({
      envVar: `RESEND_TEMPLATE_RESET_${locale.toUpperCase()}`,
      name: `reset-password-${locale}`,
      id: resetId,
    });

    console.log(`[${locale.toUpperCase()}] Two-factor OTP`);

    const otpHtml = await render(
      await TwoFactorOtpEmail({ otpCode: "{{{OTP_CODE}}}", locale }),
      { pretty: false },
    );

    const otpId = await upsertTemplate({
      name: `two-factor-otp-${locale}`,
      from: `Portfolio Security <${links.email}>`,
      subject: twoFactorOtpSubjects[locale],
      html: otpHtml,
      variables: [{ key: "OTP_CODE", type: "string", fallbackValue: "000000" }],
    });

    results.push({
      envVar: `RESEND_TEMPLATE_TWO_FACTOR_${locale.toUpperCase()}`,
      name: `two-factor-otp-${locale}`,
      id: otpId,
    });
  }

  console.log("\n✅ Done! Add these to your .env:\n");
  for (const { envVar, id } of results) {
    console.log(`${envVar}=${id}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
