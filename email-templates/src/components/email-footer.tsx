import { Section, Text, Link, Hr, Img } from "@react-email/components";
import { theme, links } from "../theme";
import { icons } from "./icons";

/**
 * Standard footer across transactional emails — only `note` and `year` change.
 *
 * `year` must be passed explicitly — the template HTML is rendered ONCE at
 * publish time, so `new Date()` inside the component would freeze the year
 * to whenever `publish:resend` was last run. Pass it from the parent so
 * it's obvious at the call site and easy to keep correct.
 */
export function EmailFooter({ note, year }: { note: string; year: number }) {
  return (
    <Section style={{ padding: "4px 32px 28px" }}>
      <Hr style={{ borderColor: theme.colors.border, margin: "0 0 18px" }} />

      <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
        <tbody>
          <tr>
            <td style={{ paddingRight: 16 }}>
              <Img
                src={icons.linkedinMuted}
                width={14}
                height={14}
                alt="LinkedIn"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 5,
                }}
              />
              <Link
                href={links.linkedin}
                style={{
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.font.sans,
                  textDecoration: "none",
                  verticalAlign: "middle",
                }}
              >
                LinkedIn
              </Link>
            </td>
            <td style={{ paddingRight: 16 }}>
              <Img
                src={icons.githubMuted}
                width={14}
                height={14}
                alt="GitHub"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 5,
                }}
              />
              <Link
                href={links.github}
                style={{
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.font.sans,
                  textDecoration: "none",
                  verticalAlign: "middle",
                }}
              >
                GitHub
              </Link>
            </td>
            <td>
              <Link
                href={links.portfolio}
                style={{
                  fontSize: 12,
                  color: theme.colors.brand,
                  fontFamily: theme.font.sans,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                jesushg.com
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
        © {year} Jesús Hernández · {links.location}
      </Text>
    </Section>
  );
}
