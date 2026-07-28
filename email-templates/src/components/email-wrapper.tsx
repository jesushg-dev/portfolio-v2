import { Html, Head, Preview, Body, Container } from "@react-email/components";
import type { ReactNode } from "react";
import { theme } from "../theme";

export type Locale = "en" | "es" | "nl";

export function EmailWrapper({
  preview,
  lang = "en",
  children,
}: {
  preview: string;
  lang?: Locale;
  children: ReactNode;
}) {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: theme.colors.pageBackground,
          margin: 0,
          padding: "32px 16px",
          fontFamily: theme.font.sans,
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            backgroundColor: theme.colors.cardBackground,
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${theme.colors.border}`,
            boxShadow: "0 8px 28px rgba(46,90,235,0.10)",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
