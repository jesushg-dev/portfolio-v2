import { Section, Text } from "@react-email/components";
import { theme } from "../theme";

export function HighlightCard({ children }: { children: string }) {
  return (
    <Section style={{ padding: "18px 32px 4px" }}>
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
                backgroundColor: "#F2F6FF",
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
                }}
              >
                {children}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
