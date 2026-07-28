import { Section, Text, Button } from "@react-email/components";
import { createTranslator } from "next-intl";
import { EmailWrapper } from "./components/email-wrapper";
import { EmailHeader } from "./components/email-header";
import { EmailFooter } from "./components/email-footer";
import { theme } from "./theme";
import { loadMessages, type Locale } from "./load-messages";

export interface ResetPasswordEmailProps {
  resetUrl?: string;
  locale?: Locale;
}

export default async function ResetPasswordEmail({
  resetUrl = "https://jehg.dev/reset-password?token=example",
  locale = "en",
}: ResetPasswordEmailProps) {
  const messages = await loadMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "reset-password" });

  return (
    <EmailWrapper preview={t("preview")} lang={locale}>
      <EmailHeader eyebrow={t("eyebrow")} />

      <Section style={{ padding: "24px 32px 0" }}>
        <Text
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: "24px",
            color: theme.colors.textPrimary,
            fontFamily: theme.font.sans,
          }}
        >
          {t("greeting")}
        </Text>
        <Text
          style={{
            margin: "12px 0 0",
            fontSize: 15,
            lineHeight: "24px",
            color: theme.colors.textPrimary,
            fontFamily: theme.font.sans,
          }}
        >
          {t("body1")}
        </Text>
      </Section>

      <Section style={{ padding: "24px 32px 8px" }}>
        <Button
          href={resetUrl}
          style={{
            backgroundColor: theme.colors.brand,
            color: "#FFFFFF",
            fontFamily: theme.font.sans,
            fontSize: 14,
            fontWeight: 600,
            padding: "12px 22px",
            borderRadius: 8,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          {t("button")}
        </Button>
      </Section>

      <Section style={{ padding: "8px 32px 12px" }}>
        <Text
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: "20px",
            color: theme.colors.textMuted,
            fontFamily: theme.font.sans,
          }}
        >
          {t("body2")}
        </Text>
      </Section>

      <EmailFooter note={t("footer")} year={new Date().getFullYear()} />
    </EmailWrapper>
  );
}

ResetPasswordEmail.PreviewProps = {
  resetUrl: "https://jehg.dev/reset-password?token=example",
  locale: "en" as Locale,
};
