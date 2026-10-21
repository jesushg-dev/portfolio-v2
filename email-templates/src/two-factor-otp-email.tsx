import { Section, Text } from "@react-email/components";
import { createTranslator } from "next-intl";
import { EmailWrapper } from "./components/email-wrapper";
import { EmailHeader } from "./components/email-header";
import { EmailFooter } from "./components/email-footer";
import { theme } from "./theme";
import { loadMessages, type Locale } from "./load-messages";

export interface TwoFactorOtpEmailProps {
  /** Rendered as-is; pass `{{{OTP_CODE}}}` to compile a Resend template. */
  otpCode?: string;
  locale?: Locale;
}

export default async function TwoFactorOtpEmail({
  otpCode = "123456",
  locale = "en",
}: TwoFactorOtpEmailProps) {
  const messages = await loadMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "two-factor-otp" });

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

      <Section style={{ padding: "20px 32px 8px" }}>
        <Text
          style={{
            margin: 0,
            padding: "16px 20px",
            fontSize: 30,
            lineHeight: "36px",
            fontWeight: 700,
            letterSpacing: "0.3em",
            textAlign: "center",
            color: theme.colors.brand,
            backgroundColor: theme.colors.codeBackground,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 10,
            fontFamily: theme.font.mono,
          }}
        >
          {otpCode}
        </Text>
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
          {t("expires")}
        </Text>
        <Text
          style={{
            margin: "10px 0 0",
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

TwoFactorOtpEmail.PreviewProps = {
  otpCode: "123456",
  locale: "en" as Locale,
};
