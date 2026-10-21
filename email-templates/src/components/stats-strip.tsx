import { Section, Text } from "@react-email/components";
import { theme } from "../theme";

export interface Stat {
  value: string;
  label: string;
}

/** Mirrors the "6+ / 19+ / 49" stat row from the jesushg.com hero — same real numbers.
 *  If `stats` is empty or not provided, the section is not rendered at all. */
export function StatsStrip({ stats }: { stats?: Stat[] }) {
  if (!stats || stats.length === 0) return null;

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
            {stats.map((stat, i) => (
              <td
                key={i}
                style={{
                  width: `${100 / stats.length}%`,
                  textAlign: "center",
                  padding: "14px 4px",
                  backgroundColor: theme.colors.pageBackground,
                  borderLeft:
                    i === 0 ? `1px solid ${theme.colors.border}` : "none",
                  borderTop: `1px solid ${theme.colors.border}`,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  borderRight: `1px solid ${theme.colors.border}`,
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    color: theme.colors.brand,
                    fontFamily: theme.font.sans,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: theme.colors.textMuted,
                    fontFamily: theme.font.sans,
                  }}
                >
                  {stat.label}
                </Text>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
