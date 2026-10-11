"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useThemeContext } from "@/hoc/theme-context-provider";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          action?: string;
          cData?: string;
          callback?: (token: string) => void;
          "error-callback"?: (error: unknown) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileWidgetProps {
  siteKey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: unknown) => void;
  onWidgetId?: (widgetId: string) => void;
  className?: string;
}

export function TurnstileWidget({
  siteKey,
  action = "contact",
  appearance = "interaction-only",
  onSuccess,
  onExpire,
  onError,
  onWidgetId,
  className,
}: TurnstileWidgetProps) {
  const { isDark } = useThemeContext();
  const theme = isDark ? "dark" : "light";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) {
        return;
      }

      if (widgetIdRef.current) {
        return;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance,
          theme,
          callback: (token: string) => {
            if (isMounted) {
              onSuccess(token);
            }
          },
          "expired-callback": () => {
            if (isMounted) {
              onExpire?.();
            }
          },
          "error-callback": (err: unknown) => {
            if (isMounted) {
              onError?.(err);
            }
          },
        });

        widgetIdRef.current = id;
        onWidgetId?.(id);
      } catch {
        // Container may already be initialized
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      window.onTurnstileLoaded = () => {
        renderWidget();
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore unmount error
        }
        widgetIdRef.current = null;
      }
    };
  }, [
    siteKey,
    action,
    appearance,
    theme,
    onSuccess,
    onExpire,
    onError,
    onWidgetId,
  ]);

  return (
    <>
      <Script
        id="cloudflare-turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded"
        strategy="afterInteractive"
        onLoad={() => {
          if (
            window.turnstile &&
            containerRef.current &&
            !widgetIdRef.current
          ) {
            try {
              const id = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                action,
                appearance,
                theme,
                callback: (token: string) => onSuccess(token),
                "expired-callback": () => onExpire?.(),
                "error-callback": (err: unknown) => onError?.(err),
              });
              widgetIdRef.current = id;
              onWidgetId?.(id);
            } catch {
              // Ignore duplicate render
            }
          }
        }}
      />
      <div
        ref={containerRef}
        id="cf-turnstile-container"
        className={className ?? "my-1 flex justify-center empty:hidden"}
      />
    </>
  );
}
