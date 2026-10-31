import "@testing-library/jest-dom";
import type { ImgHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { createElement, Fragment } from "react";
import { TextDecoder, TextEncoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

if (typeof document !== "undefined" && !document.elementFromPoint) {
  document.elementFromPoint = () => null;
}

if (typeof Element !== "undefined" && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}

if (
  typeof window !== "undefined" &&
  typeof window.PointerEvent === "undefined"
) {
  window.PointerEvent =
    class PointerEvent extends MouseEvent {} as unknown as typeof PointerEvent;
}

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

delete process.env.TURNSTILE_SECRET;

if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class PolyfillResponse {
    status: number;
    headers: Headers;
    constructor(
      _body?: unknown,
      init?: { status?: number; headers?: HeadersInit },
    ) {
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }

    json(): Promise<unknown> {
      return Promise.resolve(null);
    }
  } as unknown as typeof Response;
}

if (typeof globalThis.Request === "undefined") {
  globalThis.Request = class PolyfillRequest {
    url: string;
    method: string;
    headers: Headers;
    body?: unknown;
    constructor(
      input: string | { url: string },
      init?: { method?: string; headers?: HeadersInit; body?: unknown },
    ) {
      this.url = typeof input === "string" ? input : input.url;
      this.method = init?.method ?? "GET";
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }

    clone() {
      return new PolyfillRequest(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }
  } as unknown as typeof Request;
}

if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
}

import enMessages from "../../messages/en.json";

const mockMotionPropKeys = new Set([
  "animate",
  "custom",
  "drag",
  "dragConstraints",
  "dragControls",
  "dragElastic",
  "dragListener",
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
  "preload",
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

  const renderRich = (
    namespace: string,
    key: string,
    values?: Record<string, (chunks: ReactNode) => ReactNode>,
  ): ReactNode => {
    const template = resolveMessage(namespace, key);
    const linkRenderer = values?.link;
    if (!linkRenderer) return template;

    const match = /^(.*)<link>([\s\S]*)<\/link>([\s\S]*)$/.exec(template);
    if (!match) return template;

    const [, before, linkText, after] = match;
    return createElement(Fragment, null, before, linkRenderer(linkText), after);
  };

  return {
    useTranslations: (namespace: string) => {
      const translate = (key: string) => resolveMessage(namespace, key);
      translate.rich = (
        key: string,
        values: Record<string, (chunks: ReactNode) => ReactNode>,
      ) => renderRich(namespace, key, values);

      return translate;
    },
    useLocale: () => "en",
    useFormatter: () => ({
      number: (value: number) => String(value),
      dateTime: (date: Date) =>
        date instanceof Date ? date.toLocaleDateString() : String(date),
    }),
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
  const componentCache = new Map<
    string,
    React.ComponentType<PropsWithChildren<Record<string, unknown>>>
  >();

  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (!componentCache.has(prop)) {
          componentCache.set(
            prop,
            ({
              children,
              ...props
            }: PropsWithChildren<Record<string, unknown>>) =>
              createElement(
                prop,
                mockOmitKeys(props, mockMotionPropKeys),
                children,
              ),
          );
        }
        return componentCache.get(prop)!;
      },
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
    useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((result, part, index) => {
        const value = values[index];
        const rendered =
          value && typeof value === "object" && "get" in value
            ? (value as { get: () => unknown }).get()
            : (value ?? "");
        return `${result}${part}${String(rendered)}`;
      }, ""),
    useSpring: (v: unknown) => v,
    useTransform: (v: unknown) => v,
    useReducedMotion: () => false,
    useInView: () => false,
    useDragControls: () => ({
      start: jest.fn(),
    }),
    animate: jest.fn(
      (value: { set: (next: number) => void }, target: number) => {
        value.set(target);
        return Promise.resolve();
      },
    ),
  };
});

jest.mock("next-intl/server", () => {
  const createMockTranslator = () => {
    const t = (key: string) => key;
    t.has = () => true;
    t.raw = (key: string) => key;
    t.rich = (key: string) => key;
    t.markup = (key: string) => key;
    return t;
  };

  return {
    getTranslations: jest.fn(() => Promise.resolve(createMockTranslator())),
  };
});

jest.mock("next-intl/routing", () => ({
  defineRouting: (config: unknown) => config,
}));

jest.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: ({
      children,
      href,
      ...props
    }: PropsWithChildren<{ href: string; prefetch?: boolean }>) => {
      const rest = { ...props };
      delete (rest as { prefetch?: boolean }).prefetch;
      return createElement("a", { href, ...rest }, children);
    },
    redirect: jest.fn(),
    usePathname: jest.fn(() => "/"),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    })),
    getPathname: jest.fn(({ href }: { href: string }) => href),
  }),
}));

jest.mock("@t3-oss/env-nextjs", () => ({
  createEnv: (opts: { runtimeEnv: Record<string, unknown> }) => opts.runtimeEnv,
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => Promise.resolve(new Headers())),
}));

jest.mock(
  "next/root-params",
  () => ({
    locale: jest.fn(() => Promise.resolve("en")),
    site: jest.fn(() => Promise.resolve("primary")),
  }),
  { virtual: true },
);

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth-redirect", () => ({
  redirectToLogin: jest.fn(),
  redirectToAdmin: jest.fn(),
}));

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

Element.prototype.scrollIntoView = jest.fn();
