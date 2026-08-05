/**
 * lib/docx/rebuilder.ts
 *
 * Rebuilds a .docx file from:
 *   - The original zip (with all images/styles intact)
 *   - The original document.xml raw string
 *   - The adapted sections returned by the AI
 *
 * Strategy: direct XML string manipulation.
 * We locate each <w:p> by its index in the paragraph array, then replace
 * the text content of its <w:t> nodes one by one.
 * This avoids any XML serialization that could corrupt attributes or namespaces.
 */

import JSZip from "jszip";
import type { Locale } from "@/i18n/config";

import type { AdaptedSection, CvSection } from "@/lib/types";
import { splitIntoParagraphs } from "./split-paragraphs";

/**
 * Replace <w:t> text nodes inside a single <w:p> XML string.
 * Puts adapted run texts into the matching <w:t> nodes.
 * Preserves all attributes (xml:space, etc.) and formatting.
 */
function replaceWtNodes(paraXml: string, adaptedTexts: string[]): string {
  let runIndex = 0;
  return paraXml.replace(
    /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g,
    (
      _match: string,
      openTag: string,
      _oldText: string,
      closeTag: string,
    ): string => {
      if (runIndex < adaptedTexts.length) {
        const newText = escapeXml(adaptedTexts[runIndex]);
        runIndex++;

        const hasPreserve = openTag.includes("xml:space");
        const needsPreserve = newText.startsWith(" ") || newText.endsWith(" ");
        const finalOpen =
          needsPreserve && !hasPreserve
            ? openTag.replace("<w:t", '<w:t xml:space="preserve"')
            : openTag;

        return `${finalOpen}${newText}${closeTag}`;
      }
      return `${openTag}${closeTag}`;
    },
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeHeading(text: string): string {
  return text.trim().toLowerCase().replace(/[.:]/g, "").replace(/\s+/g, " ");
}

function applyHeadingCase(localized: string, source: string): string {
  const sourceTrimmed = source.trim();
  if (!sourceTrimmed) return localized;

  const lettersOnly = sourceTrimmed.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase()) {
    return localized.toUpperCase();
  }

  return localized;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceCaseInsensitive(
  text: string,
  source: string,
  target: string,
): string {
  const pattern = new RegExp(escapeRegex(source), "gi");
  return text.replace(pattern, (match) => applyHeadingCase(target, match));
}

function localizeStaticText(text: string, locale?: Locale): string {
  if (!locale) return text;

  const glossaryByLocale: Record<Locale, Record<string, string>> = {
    en: {
      "Bases de datos": "Databases",
      Herramientas: "Tools",
      Español: "Spanish",
      Inglés: "English",
      "Competencia profesional (B2)": "Professional Working Proficiency (B2)",
      "Nativo o bilingüe (C2)": "Native or Bilingual (C2)",
      "Ingeniería en Computación": "Computer Engineering",
      "Desarrollador Full Stack": "Full Stack Developer",
      "Desarrollador Fullstack": "Fullstack Developer",
      "Capacitación en Seguridad Digital y Protección de Datos":
        "Digital Security and Data Protection Training",
    },
    es: {
      Summary: "Sobre mí",
      Profile: "Sobre mí",
      "About me": "Sobre mí",
      Databases: "Bases de datos",
      Tools: "Herramientas",
      English: "Inglés",
      Spanish: "Español",
      "Native or Bilingual": "Nativo o bilingüe",
      "Professional Working Proficiency (B2)": "Competencia profesional (B2)",
      "Native or Bilingual (C2)": "Nativo o bilingüe (C2)",
      "Computer Engineering": "Ingeniería en Computación",
      "Full Stack Developer": "Desarrollador Full Stack",
      "Fullstack Developer": "Desarrollador Fullstack",
      "Full-Stack Developer": "Desarrollador Full-Stack",
      "Senior Software Engineer": "Ingeniero de Software Senior",
      "Mobile Developer": "Desarrollador móvil",
      "IT Technician & Web Developer": "Técnico de TI y Desarrollador Web",
      "IT Technician &amp; Web Developer": "Técnico de TI y Desarrollador Web",
      "Full-time": "Tiempo completo",
      Remote: "Remoto",
      Hybrid: "Híbrido",
      Local: "Presencial",
      Present: "Actualidad",
      August: "Agosto",
      September: "Septiembre",
      October: "Octubre",
      November: "Noviembre",
      December: "Diciembre",
      January: "Enero",
      February: "Febrero",
      March: "Marzo",
      April: "Abril",
      May: "Mayo",
      June: "Junio",
      July: "Julio",
      "Digital Security and Data Protection Training":
        "Capacitación en Seguridad Digital y Protección de Datos",
    },
    nl: {
      Databases: "Databases",
      Tools: "Tools",
      English: "Engels",
      Spanish: "Spaans",
      "Professional Working Proficiency (B2)":
        "Professionele werkvaardigheid (B2)",
      "Native or Bilingual (C2)": "Moedertaal of tweetalig (C2)",
      "Computer Engineering": "Computertechniek",
      "Full Stack Developer": "Full Stack Developer",
      "Fullstack Developer": "Fullstack ontwikkelaar",
      "Full-Stack Developer": "Full-Stack Developer",
      "Digital Security and Data Protection Training":
        "Training Digitale Beveiliging en Gegevensbescherming",
    },
  };

  const glossary = glossaryByLocale[locale];
  if (!glossary) return text;

  // Longer phrases first so "Native or Bilingual (C2)" wins over "Native or Bilingual".
  const entries = Object.entries(glossary).sort(
    (a, b) => b[0].length - a[0].length,
  );

  let localizedText = text;
  for (const [source, target] of entries) {
    localizedText = replaceCaseInsensitive(localizedText, source, target);
  }
  return localizedText;
}

function getLocalizedHeading(
  text: string,
  locale: Locale | undefined,
): string | null {
  if (!locale) return null;

  const normalized = normalizeHeading(text);
  const headingMap: Record<Locale, Record<string, string>> = {
    en: {
      "about me": "About Me",
      "professional experience": "Professional Experience",
      experience: "Experience",
      education: "Education",
      "technical skills": "Technical Skills",
      skills: "Skills",
      "soft skills": "Soft Skills",
      languages: "Languages",
      contact: "Contact",
      "contact me": "Contact Me",
      "additional information": "Additional Information",
      "personal references": "Personal References",
    },
    es: {
      "about me": "Sobre mí",
      "professional experience": "Experiencia profesional",
      experience: "Experiencia",
      education: "Educación",
      "technical skills": "Habilidades técnicas",
      skills: "Habilidades",
      "soft skills": "Habilidades blandas",
      languages: "Idiomas",
      contact: "Contacto",
      "contact me": "Contacto",
      "additional information": "Información adicional",
      "personal references": "Referencias personales",
    },
    nl: {
      "about me": "Over mij",
      "professional experience": "Werkervaring",
      experience: "Ervaring",
      education: "Opleiding",
      "technical skills": "Technische vaardigheden",
      skills: "Vaardigheden",
      "soft skills": "Persoonlijke vaardigheden",
      languages: "Talen",
      contact: "Contact",
      "contact me": "Contact",
      "additional information": "Aanvullende informatie",
      "personal references": "Persoonlijke referenties",
    },
  };

  return headingMap[locale][normalized] ?? null;
}

function replaceStaticHeadings(paraXml: string, locale?: Locale): string {
  if (!locale) return paraXml;

  const wtMatches = [
    ...paraXml.matchAll(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g),
  ];
  if (wtMatches.length === 0) return paraXml;

  const joined = wtMatches.map((match) => unescapeXml(match[2] ?? "")).join("");

  const localizedHeading = getLocalizedHeading(joined, locale);
  const localizedJoined = localizedHeading
    ? applyHeadingCase(localizedHeading, joined)
    : localizeStaticText(joined, locale);

  if (localizedJoined === joined) return paraXml;

  // Put the full localized sentence in the first run and clear the rest so
  // phrases split across multiple <w:t> nodes still translate correctly.
  let runIndex = 0;
  return paraXml.replace(
    /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g,
    (_match, openTag: string, _oldText: string, closeTag: string): string => {
      if (runIndex === 0) {
        runIndex += 1;
        const hasPreserve = openTag.includes("xml:space");
        const needsPreserve =
          localizedJoined.startsWith(" ") || localizedJoined.endsWith(" ");
        const finalOpen =
          needsPreserve && !hasPreserve
            ? openTag.replace("<w:t", '<w:t xml:space="preserve"')
            : openTag;
        return `${finalOpen}${escapeXml(localizedJoined)}${closeTag}`;
      }
      runIndex += 1;
      return `${openTag}${closeTag}`;
    },
  );
}

export async function rebuildDocx(
  zipFiles: JSZip,
  rawXml: string,
  originalSections: CvSection[],
  adaptedSections: AdaptedSection[],
  locale?: Locale,
): Promise<Buffer> {
  const adaptedByXmlIndex = new Map<number, string[]>();
  for (const section of originalSections) {
    const adaptedSection = adaptedSections.find((s) => s.id === section.id);
    if (!adaptedSection) continue;
    for (const origPara of section.paragraphs) {
      const adaptedPara = adaptedSection.paragraphs.find(
        (p) => p.id === origPara.id,
      );
      if (!adaptedPara) continue;
      adaptedByXmlIndex.set(
        origPara.xmlIndex,
        adaptedPara.runs.map((r) => r.text),
      );
    }
  }

  const parts = splitIntoParagraphs(rawXml);
  let paragraphCount = 0;

  const newParts = parts.map((part) => {
    if (!part.startsWith("<w:p")) {
      return part;
    }

    const xmlIndex = paragraphCount++;
    const adaptedTexts = adaptedByXmlIndex.get(xmlIndex);
    if (!adaptedTexts || adaptedTexts.length === 0) {
      return replaceStaticHeadings(part, locale);
    }
    return replaceStaticHeadings(replaceWtNodes(part, adaptedTexts), locale);
  });

  const newXml = newParts.join("");

  const newZip = new JSZip();
  const filePromises: Promise<void>[] = [];

  zipFiles.forEach((relativePath, file) => {
    if (file.dir) return;

    if (relativePath === "word/document.xml") {
      newZip.file(relativePath, newXml);
    } else {
      filePromises.push(
        file.async("nodebuffer").then((content) => {
          newZip.file(relativePath, content);
        }),
      );
    }
  });

  await Promise.all(filePromises);

  const output = await newZip.generateAsync({
    type: "nodebuffer",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return output;
}
