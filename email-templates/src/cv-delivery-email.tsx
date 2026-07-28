import { Section, Text } from "@react-email/components";
import { createTranslator } from "next-intl";
import { EmailWrapper } from "./components/email-wrapper";
import { EmailHeader } from "./components/email-header";
import { EmailFooter } from "./components/email-footer";
import { StatsStrip } from "./components/stats-strip";
import { HighlightCard } from "./components/highlight-card";
import { theme } from "./theme";
import { loadMessages, type Locale } from "./load-messages";

export interface CvDeliveryEmailProps {
  recipientName?: string;
  locale?: Locale;
}

export default async function CvDeliveryEmail({
  recipientName = "there",
  locale = "en",
}: CvDeliveryEmailProps) {
  const messages = await loadMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "cv-delivery" });

  return (
    <EmailWrapper preview={t("preview")} lang={locale}>
      <EmailHeader tagline={t("tagline")} />

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
          {t("greeting", { recipientName })}
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

      <StatsStrip
        stats={[
          { value: "6+", label: t("stats.years") },
          { value: "19+", label: t("stats.projects") },
          { value: "49", label: t("stats.certifications") },
        ]}
      />

      <HighlightCard>{t("highlight")}</HighlightCard>

      <Section style={{ padding: "18px 32px 0" }}>
        <Text
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: "24px",
            color: theme.colors.textPrimary,
            fontFamily: theme.font.sans,
          }}
        >
          {t("body2")}
        </Text>
        <Text
          style={{
            margin: "18px 0 0",
            fontSize: 15,
            lineHeight: "24px",
            color: theme.colors.textPrimary,
            fontFamily: theme.font.sans,
          }}
        >
          {t("signOff")}
        </Text>
        <Text
          style={{
            margin: "2px 0 26px",
            fontSize: 15,
            lineHeight: "22px",
            fontFamily: theme.font.sans,
          }}
        >
          <strong style={{ color: theme.colors.textPrimary }}>
            {t("name")}
          </strong>
          <br />
          <span style={{ color: theme.colors.textMuted, fontSize: 13.5 }}>
            {t("role")}
          </span>
        </Text>
      </Section>

      <EmailFooter note={t("footer")} year={new Date().getFullYear()} />
    </EmailWrapper>
  );
}

CvDeliveryEmail.PreviewProps = {
  locale: "en" as Locale,
  recipientName: "John Lennon",
};
