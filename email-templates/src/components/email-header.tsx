import { Section, Text } from "@react-email/components";
import { theme } from "../theme";

/**
 * Soft brand header: tinted background band + the real "Jehg" wordmark,
 * same weight/letter-spacing as the nav logo on jesushg.com. Gives the email
 * some visual presence without going back to a fake dark "app" banner.
 */
export function EmailHeader({
  eyebrow,
  tagline,
}: {
  eyebrow?: string;
  tagline?: string;
}) {
  return (
    <Section
      style={{
        backgroundColor: theme.colors.pageBackground,
        padding: "26px 32px 22px",
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 800,
          color: theme.colors.brand,
          fontFamily: theme.font.sans,
          letterSpacing: "-0.03em",
        }}
      >
        Jehg
      </Text>
      {tagline ? (
        <Text
          style={{
            margin: "4px 0 0",
            fontSize: 13.5,
            color: theme.colors.textSecondary,
            fontFamily: theme.font.sans,
          }}
        >
          {tagline}
        </Text>
      ) : null}
      {eyebrow ? (
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ marginTop: 14 }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: "#E4EBFC",
                  borderRadius: 20,
                  padding: "5px 12px",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.colors.brandDark,
                    fontFamily: theme.font.sans,
                  }}
                >
                  {eyebrow}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      ) : null}
    </Section>
  );
}
