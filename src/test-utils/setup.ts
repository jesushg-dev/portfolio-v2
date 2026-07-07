import "@testing-library/jest-dom";
import type { ImgHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { createElement } from "react";

import enMessages from "../../messages/en.json";

jest.mock("next-intl", () => {
  const messages = enMessages as Record<string, unknown>;

  const resolveMessage = (namespace: string, key: string): string => {
    const namespaceParts = namespace.split(".");
    let value: unknown = messages;

    for (const part of namespaceParts) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[part];
      }
    }

    const parts = key.split(".");
    for (const part of parts) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[part];
      }
    }

    return typeof value === "string" ? value : key;
  };

  return {
    useTranslations: (namespace: string) => (key: string) =>
      resolveMessage(namespace, key),
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImgHTMLAttributes<HTMLImageElement>) =>
    createElement("img", props),
}));

jest.mock("motion/react", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) =>
        ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
          createElement(prop, props, children),
    },
  );

  const useMotionValue = (initial: number) => {
    let current = initial;

    return {
      get: () => current,
      set: (next: number) => {
        current = next;
      },
      stop: jest.fn(),
    };
  };

  return {
    motion,
    AnimatePresence: ({ children }: PropsWithChildren) =>
      createElement("div", null, children),
    useMotionValue,
    animate: jest.fn(
      (value: { set: (next: number) => void }, target: number) => {
        value.set(target);
        return Promise.resolve();
      },
    ),
  };
});
