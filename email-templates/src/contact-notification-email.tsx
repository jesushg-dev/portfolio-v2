import { Section, Text, Link, Button } from "@react-email/components";
import { createTranslator } from "next-intl";
import { EmailWrapper } from "./components/email-wrapper";
import { EmailHeader } from "./components/email-header";
import { EmailFooter } from "./components/email-footer";
import { theme } from "./theme";
import { loadMessages, type Locale } from "./load-messages";

export interface ContactNotificationEmailProps {
  senderName?: string;
  senderEmail?: string;
  message?: string;
  sentAt?: string;
  locale?: Locale;
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ marginBottom: 2 }}
    >
      <tbody>
        <tr>
          <td style={{ width: 76, verticalAlign: "top", padding: "5px 0" }}>
            <Text
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.4,
                color: theme.colors.textMuted,
                textTransform: "uppercase",
                fontFamily: theme.font.sans,
              }}
            >
              {label}
            </Text>
          </td>
          <td style={{ verticalAlign: "top", padding: "5px 0" }}>
            {href ? (
              <Link
                href={href}
                style={{
                  fontSize: 14,
                  color: theme.colors.brand,
                  fontFamily: theme.font.sans,
                  textDecoration: "none",
                }}
              >
                {value}
              </Link>
            ) : (
              <Text
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.font.sans,
                }}
              >
                {value}
              </Text>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default async function ContactNotificationEmail({
  senderName = "hello world",
  senderEmail = "[email protected]",
  message = "Hola amigo, quisiera un nuevo servicio y tengo una nueva idea donde me puedes colaborar.",
  sentAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }),
  locale = "en",
}: ContactNotificationEmailProps) {
  const messages = await loadMessages(locale);
  const t = createTranslator({
    locale,
    messages,
    namespace: "contact-notification",
  });

  const firstName = senderName.split(" ")[0];

  return (
    <EmailWrapper preview={t("preview", { senderName })} lang={locale}>
      <EmailHeader eyebrow={t("eyebrow")} />

      <Section style={{ padding: "22px 32px 0" }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: theme.colors.pageBackground,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                }}
              >
                <InfoRow label={t("labelFrom")} value={senderName} />
                <InfoRow
                  label={t("labelEmail")}
                  value={senderEmail}
                  href={`mailto:${senderEmail}`}
                />
                <InfoRow label={t("labelReceived")} value={sentAt} />
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={{ padding: "20px 32px 0" }}>
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: 11.5,
            letterSpacing: 1,
            color: theme.colors.textMuted,
            fontFamily: theme.font.sans,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {t("labelMessage")}
        </Text>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: theme.colors.codeBackground,
                  border: `1px solid ${theme.colors.border}`,
                  borderLeft: `3px solid ${theme.colors.brand}`,
                  borderRadius: "0 8px 8px 0",
                  padding: "16px 18px",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 14.5,
                    lineHeight: "23px",
                    color: theme.colors.textPrimary,
                    fontFamily: theme.font.sans,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={{ padding: "22px 32px 8px" }}>
        <Button
          href={`mailto:${senderEmail}?subject=${encodeURIComponent("Re: your message on jehg.dev")}`}
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
          {t("replyButton", { firstName })}
        </Button>
      </Section>

      <EmailFooter note={t("footer")} year={new Date().getFullYear()} />
    </EmailWrapper>
  );
}

ContactNotificationEmail.PreviewProps = {
  senderName: "hello world",
  senderEmail: "[email protected]",
  message:
    "Hola amigo, quisiera un nuevo servicio y tengo una nueva idea donde me puedes colaborar.",
  sentAt: "Jul 22, 2026, 3:41 PM",
  locale: "en" as Locale,
};
