import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";
import messages from "../../../../../../messages/en.json";

import Home from "./page";

jest.mock("./metadata", () => ({ generateMetadata: jest.fn() }));
jest.mock("next-intl/server", () => ({
  getMessages: jest.fn(() => Promise.resolve(messages)),
}));
jest.mock("@/lib/public-site/locale", () => ({
  getPublicLocale: jest.fn().mockResolvedValue("es"),
}));
jest.mock("@/trpc/server", () => ({
  api: {
    portfolio: {
      getStatsPublic: jest.fn().mockResolvedValue({
        yearsExperience: 6,
        projectsCount: 25,
        certificationsCount: 49,
        engineersMentored: 6,
      }),
      getTestimonialsPublic: jest.fn().mockResolvedValue([]),
    },
  },
}));
jest.mock("@/features/home/components/hero", () => ({
  __esModule: true,
  default: () => <h1>Jesús Hernández</h1>,
}));
jest.mock("@/features/home/components/about", () => ({
  __esModule: true,
  default: () => <p>Sobre mí: desarrollo de software empresarial.</p>,
}));
jest.mock("@/features/home/components/services", () => ({
  __esModule: true,
  default: () => <h2>Servicios de desarrollo</h2>,
}));
jest.mock("@/features/home/components/soft-skills", () => ({
  __esModule: true,
  default: () => <p>Liderazgo y colaboración con equipos.</p>,
}));
jest.mock("@/features/home/components/social-proof", () => ({
  __esModule: true,
  default: () => <blockquote>Recomendación de un compañero.</blockquote>,
}));
jest.mock("@/features/home/components/skills", () => ({
  __esModule: true,
  default: () => <Link href="/es/habilidades/react">React</Link>,
}));
jest.mock("@/features/home/components/experience", () => ({
  __esModule: true,
  default: () => <h2>Experiencia profesional</h2>,
}));
jest.mock("@/features/home/components/portfolio", () => ({
  __esModule: true,
  default: () => <Link href="/es/proyectos/portfolio">Caso de estudio</Link>,
}));
jest.mock("@/features/home/components/contact", () => ({
  __esModule: true,
  default: () => <a href="mailto:hello@example.com">Contacto</a>,
}));

it("renders all primary content and links without JavaScript or scroll", async () => {
  const html = renderToStaticMarkup(await Home());
  const document = new DOMParser().parseFromString(html, "text/html");

  expect(document.querySelectorAll("h1")).toHaveLength(1);
  expect(document.querySelector("#about p")?.textContent).toContain("Sobre mí");
  expect(document.querySelector("#services h2")?.textContent).toContain(
    "Servicios",
  );
  expect(document.querySelector("#soft-skills p")?.textContent).toContain(
    "Liderazgo",
  );
  expect(document.querySelector("blockquote")?.textContent).toContain(
    "Recomendación",
  );
  expect(document.querySelector("#experience h2")?.textContent).toContain(
    "Experiencia",
  );
  expect(
    document.querySelector('a[href="/es/habilidades/react"]'),
  ).not.toBeNull();
  expect(
    document.querySelector('a[href="/es/proyectos/portfolio"]'),
  ).not.toBeNull();
  expect(document.querySelector('#contact a[href^="mailto:"]')).not.toBeNull();
  expect(document.querySelector('[hidden], [aria-hidden="true"]')).toBeNull();
});
