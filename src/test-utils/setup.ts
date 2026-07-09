import "@testing-library/jest-dom";
import type { ImgHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { createElement } from "react";

import enMessages from "../../messages/en.json";

const mockMotionPropKeys = new Set([
  "animate",
  "custom",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "exit",
  "initial",
  "layout",
  "layoutId",
  "onAnimationComplete",
  "onDrag",
  "onDragEnd",
  "onDragStart",
  "transition",
  "variants",
  "whileHover",
  "whileInView",
  "whileTap",
]);

const mockNextImagePropKeys = new Set([
  "blurDataURL",
  "fill",
  "loader",
  "placeholder",
  "priority",
  "quality",
  "sizes",
  "unoptimized",
]);

function mockOmitKeys(
  props: Record<string, unknown>,
  keys: Set<string>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!keys.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

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
  default: ({
    children,
    ...props
  }: PropsWithChildren<ImgHTMLAttributes<HTMLImageElement>>) =>
    createElement(
      "img",
      mockOmitKeys(props as Record<string, unknown>, mockNextImagePropKeys),
      children,
    ),
}));

jest.mock("motion/react", () => {
  const motion = new Proxy(
    {},
    {
      get:
        (_target, prop: string) =>
        ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
          createElement(
            prop,
            mockOmitKeys(props, mockMotionPropKeys),
            children,
          ),
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
