import { Section, Text, Link, Hr, Img } from "@react-email/components";
import { theme } from "../theme";
import { icons } from "./icons";

export interface EmailFooterLink {
  label: string;
  url: string;
  icon?: string;
}

export interface EmailFooterProps {
  note: string;
  year?: number;
  portfolioUrl?: string;
  portfolioLabel?: string;
  ownerName?: string;
  location?: string;
  links?: EmailFooterLink[];
}

/**
 * Standard footer across transactional emails — tenant aware.
 */
export function EmailFooter({
  note,
  year = new Date().getFullYear(),
  portfolioUrl,
  portfolioLabel,
  ownerName,
  location,
  links: customLinks,
}: EmailFooterProps) {
  const displayUrl = portfolioUrl || "https://www.jesushg.com";
  const displayLabel =
    portfolioLabel || displayUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const hasCustomLinks = customLinks && customLinks.length > 0;

  return (
    <Section style={{ padding: "4px 32px 28px" }}>
      <Hr style={{ borderColor: theme.colors.border, margin: "0 0 18px" }} />

      <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
        <tbody>
          <tr>
            {hasCustomLinks
              ? customLinks.map((item, idx) => (
                  <td key={idx} style={{ paddingRight: 16 }}>
                    {item.icon ? (
                      <Img
                        src={item.icon}
                        width={14}
                        height={14}
                        alt={item.label}
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: 5,
                        }}
                      />
                    ) : null}
                    <Link
                      href={item.url}
                      style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                        fontFamily: theme.font.sans,
                        textDecoration: "none",
                        verticalAlign: "middle",
                      }}
                    >
                      {item.label}
                    </Link>
                  </td>
                ))
              : null}
            <td>
              <Link
                href={displayUrl}
                style={{
                  fontSize: 12,
                  color: theme.colors.brand,
                  fontFamily: theme.font.sans,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {displayLabel}
              </Link>
            </td>
          </tr>
        </tbody>
      </table>

      <Text
        style={{
          margin: "14px 0 0",
          fontSize: 12,
          color: theme.colors.textMuted,
          fontFamily: theme.font.sans,
          lineHeight: "18px",
        }}
      >
        {note}
      </Text>
      <Text
        style={{
          margin: "4px 0 0",
          fontSize: 12,
          color: theme.colors.textMuted,
          fontFamily: theme.font.sans,
        }}
      >
        © {year}
        {ownerName ? ` ${ownerName}` : ""}
        {location ? ` · ${location}` : ""}
      </Text>
    </Section>
  );
}
