import { DEFAULT_HERO_SERVICES } from "@/components/shared/ios-device/hero-device-artwork";

export interface HeroDeviceServiceLike {
  title: string;
  badge?: string | null;
  type?: string;
  technologies?: readonly { title: string }[];
}

export function formatHeroServiceLabel(raw: string): string {
  const segment = raw.split(/[&·/+,]/)[0]?.trim() || raw.trim();
  const words = segment.split(/\s+/);
  const firstWord = words[0] || segment;
  return firstWord.length <= 10 ? firstWord : firstWord.slice(0, 10);
}

export function formatHeroServiceTech(service: HeroDeviceServiceLike): string {
  const tech = service.technologies?.[0]?.title?.trim();
  if (tech) {
    if (tech.toLowerCase().startsWith("nest")) return "NestJS";
    if (tech.toLowerCase().startsWith("node")) return "Node.js";
    if (tech.toLowerCase() === "c#" || tech.toLowerCase() === ".net")
      return ".NET";
    return tech.length > 10 ? tech.slice(0, 10) : tech;
  }
  return "Cloud";
}

export function formatHeroServices(
  services?: readonly HeroDeviceServiceLike[],
): [string, string][] {
  if (!services || services.length === 0) {
    return DEFAULT_HERO_SERVICES;
  }

  const mapped: [string, string][] = services
    .slice(0, 4)
    .map((service) => [
      formatHeroServiceLabel(service.badge || service.title),
      formatHeroServiceTech(service),
    ]);

  while (mapped.length < 4) {
    mapped.push(DEFAULT_HERO_SERVICES[mapped.length]);
  }

  return mapped;
}

export function resolveCircuitLabels(
  heroSubtitle?: string | null,
  services?: readonly HeroDeviceServiceLike[],
): {
  circuitTitle: string;
  circuitSubtitle: string;
  focusTitle: string;
  focusSubtitle: string;
} {
  let circuitTitle = "FULLSTACK";
  let focusTitle = "Fullstack";

  if (heroSubtitle?.trim()) {
    const sub = heroSubtitle.trim();
    if (/fullstack|full-stack/i.test(sub)) {
      circuitTitle = "FULLSTACK";
      focusTitle = "Fullstack";
    } else if (/backend/i.test(sub)) {
      circuitTitle = "BACKEND";
      focusTitle = "Backend";
    } else if (/frontend/i.test(sub)) {
      circuitTitle = "FRONTEND";
      focusTitle = "Frontend";
    } else if (/architect/i.test(sub)) {
      circuitTitle = "ARCHITECT";
      focusTitle = "Architecture";
    } else {
      const firstWord = sub.split(/[\s·,-]/)[0]?.trim();
      if (firstWord && firstWord.length <= 12) {
        circuitTitle = firstWord.toUpperCase();
        focusTitle = firstWord;
      }
    }
  }

  let circuitSubtitle = "REST · GraphQL";
  let focusSubtitle = "React · NestJS";

  if (services && services.length > 0) {
    const techSet = new Set<string>();
    for (const service of services) {
      for (const t of service.technologies ?? []) {
        if (t.title?.trim()) {
          techSet.add(t.title.trim());
          if (techSet.size >= 2) break;
        }
      }
      if (techSet.size >= 2) break;
    }
    const techList = Array.from(techSet);
    if (techList.length >= 2) {
      circuitSubtitle = `${techList[0]} · ${techList[1]}`;
      focusSubtitle = `${techList[0]} · ${techList[1]}`;
    } else if (techList.length === 1) {
      circuitSubtitle = techList[0];
      focusSubtitle = techList[0];
    }
  }

  return { circuitTitle, circuitSubtitle, focusTitle, focusSubtitle };
}

export interface FormatHeroDeviceProfileOptions {
  heroSubtitle?: string | null;
  services?: readonly HeroDeviceServiceLike[];
}

export function formatHeroDeviceProfile(
  options: FormatHeroDeviceProfileOptions,
) {
  const services = formatHeroServices(options.services);
  const labels = resolveCircuitLabels(options.heroSubtitle, options.services);
  return {
    services,
    ...labels,
  };
}
