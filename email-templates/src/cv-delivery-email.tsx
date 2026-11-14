import { Html, Head, Body, Preview } from "@react-email/components";
import { createTranslator } from "use-intl";
import { loadMessages, type Locale } from "./load-messages";

export interface CvDeliverySocialLink {
  label: string;
  url: string;
}

export interface CvDeliveryEmailProps {
  locale?: Locale;
  recipientName?: string;
  ownerName?: string;
  role?: string;
  bio?: string;
  portfolioUrl?: string;
  portfolioLabel?: string;
  socialLinks?: CvDeliverySocialLink[];
  location?: string;
}

export default async function CvDeliveryEmail({
  locale = "en",
  recipientName,
  ownerName,
  role,
  bio,
  portfolioUrl = "https://www.jesushg.com",
  portfolioLabel,
  socialLinks,
  location,
}: CvDeliveryEmailProps) {
  const messages = await loadMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "cv-delivery" });

  const resolvedName = ownerName?.trim() || t("name");
  const resolvedRole = role?.trim() || t("role");
  const resolvedBio = bio?.trim() || t("body1");
  const resolvedLocation = location?.trim();
  const domainLabel =
    portfolioLabel?.trim() ||
    portfolioUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const greeting = recipientName?.trim()
    ? `${t("greeting")} ${recipientName.trim()},`
    : t("greeting");

  const hasSocialLinks = socialLinks && socialLinks.length > 0;

  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
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
        `}</style>
      </Head>
      <Preview>{t("preview")}</Preview>
      <Body
        className="bg"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f1f4fb",
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          className="bg"
          style={{ backgroundColor: "#f1f4fb" }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "24px 12px" }}>
                <table
                  role="presentation"
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  className="card"
                  style={{
                    width: "100%",
                    maxWidth: 600,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        height={4}
                        style={{
                          height: 4,
                          fontSize: 0,
                          lineHeight: 0,
                          backgroundColor: "#1c58da",
                        }}
                      >
                        &nbsp;
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="px txt"
                        style={{
                          padding: "32px 36px 8px 36px",
                          fontFamily:
                            "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                          fontSize: 16,
                          lineHeight: 1.65,
                          color: "#1a1a1a",
                        }}
                      >
                        <p style={{ margin: "0 0 16px 0" }}>{greeting}</p>
                        <p style={{ margin: "0 0 16px 0" }}>{resolvedBio}</p>
                        <p style={{ margin: "0 0 24px 0" }}>{t("body2")}</p>
                        <p style={{ margin: "0 0 4px 0" }}>{t("signOff")}</p>
                        <p style={{ margin: 0, fontWeight: 700 }}>
                          {resolvedName}
                        </p>
                        {resolvedRole ? (
                          <p
                            className="muted"
                            style={{
                              margin: "0 0 16px 0",
                              fontSize: 14,
                              color: "#6b7280",
                            }}
                          >
                            {resolvedRole}
                          </p>
                        ) : null}
                        <p style={{ margin: "0 0 4px 0", fontSize: 14 }}>
                          <a
                            className="link"
                            href={portfolioUrl}
                            style={{
                              color: "#1c58da",
                              textDecoration: "none",
                            }}
                          >
                            {domainLabel}
                          </a>
                          {hasSocialLinks
                            ? socialLinks.map((link, idx) => (
                                <span key={idx}>
                                  <span
                                    className="muted"
                                    style={{ color: "#9ca3af" }}
                                  >
                                    &nbsp;·&nbsp;
                                  </span>
                                  <a
                                    className="link"
                                    href={link.url}
                                    style={{
                                      color: "#1c58da",
                                      textDecoration: "none",
                                    }}
                                  >
                                    {link.label}
                                  </a>
                                </span>
                              ))
                            : null}
                        </p>
                        {resolvedLocation ? (
                          <p
                            className="muted"
                            style={{
                              margin: 0,
                              fontSize: 14,
                              color: "#6b7280",
                            }}
                          >
                            {resolvedLocation}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="px muted"
                        style={{
                          padding: "20px 36px 28px 36px",
                          fontFamily:
                            "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: "#9ca3af",
                        }}
                      >
                        {t("footer", { domain: domainLabel })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

CvDeliveryEmail.PreviewProps = {
  locale: "en" as Locale,
};
