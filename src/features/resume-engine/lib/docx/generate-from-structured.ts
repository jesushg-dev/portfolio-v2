import JSZip from "jszip";

import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { Locale } from "@/i18n/config";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text: string, style?: "title" | "heading" | "body"): string {
  const styleMap = {
    title: "Title",
    heading: "Heading2",
    body: "Normal",
  };
  const styleXml = style
    ? `<w:pPr><w:pStyle w:val="${styleMap[style]}"/></w:pPr>`
    : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function bullet(text: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">• ${escapeXml(text)}</w:t></w:r></w:p>`;
}

function formatDateRange(
  start?: string,
  end?: string,
  current?: boolean,
  locale: Locale = "en",
): string {
  const presentByLocale: Record<Locale, string> = {
    en: "Present",
    es: "Presente",
    nl: "Heden",
  };
  if (!start && !end) return "";
  if (current) return `${start ?? ""} – ${presentByLocale[locale]}`.trim();
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "";
}

function getSectionLabels(locale: Locale) {
  const labelsByLocale: Record<
    Locale,
    {
      summary: string;
      experience: string;
      education: string;
      skills: string;
      languages: string;
      certifications: string;
    }
  > = {
    en: {
      summary: "Summary",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      languages: "Languages",
      certifications: "Certifications",
    },
    es: {
      summary: "Resumen",
      experience: "Experiencia",
      education: "Educación",
      skills: "Habilidades",
      languages: "Idiomas",
      certifications: "Certificaciones",
    },
    nl: {
      summary: "Samenvatting",
      experience: "Ervaring",
      education: "Opleiding",
      skills: "Vaardigheden",
      languages: "Talen",
      certifications: "Certificeringen",
    },
  };

  return labelsByLocale[locale];
}

function buildDocumentBody(draft: CvImportDraft): string {
  const parts: string[] = [];
  const locale = draft.detectedLocale;
  const labels = getSectionLabels(locale);

  parts.push(paragraph(draft.header.fullName, "title"));
  if (draft.header.degree) {
    parts.push(paragraph(draft.header.degree, "body"));
  }

  const contactLine = draft.contacts.map((c) => c.value).join(" | ");
  if (contactLine) {
    parts.push(paragraph(contactLine, "body"));
  }

  if (draft.header.summary) {
    parts.push(paragraph(labels.summary, "heading"));
    parts.push(paragraph(draft.header.summary, "body"));
  }

  if (draft.experiences.length > 0) {
    parts.push(paragraph(labels.experience, "heading"));
    for (const exp of draft.experiences) {
      const dateLine = formatDateRange(
        exp.startDate,
        exp.endDate,
        exp.current,
        locale,
      );
      const header = [exp.role, exp.company, dateLine, exp.location]
        .filter(Boolean)
        .join(" — ");
      parts.push(paragraph(header, "body"));
      for (const resp of exp.responsibilities) {
        if (resp.trim()) parts.push(bullet(resp));
      }
    }
  }

  if (draft.education.length > 0) {
    parts.push(paragraph(labels.education, "heading"));
    for (const edu of draft.education) {
      const years =
        edu.startYear || edu.endYear
          ? `${edu.startYear ?? ""}${edu.endYear ? ` – ${edu.endYear}` : ""}`
          : "";
      const line = [edu.degreeName, edu.institution, years, edu.location]
        .filter(Boolean)
        .join(" — ");
      parts.push(paragraph(line, "body"));
    }
  }

  if (draft.skills.length > 0) {
    parts.push(paragraph(labels.skills, "heading"));
    for (const group of draft.skills) {
      parts.push(
        paragraph(`${group.category}: ${group.items.join(", ")}`, "body"),
      );
    }
  }

  if (draft.languages.length > 0) {
    parts.push(paragraph(labels.languages, "heading"));
    const langLine = draft.languages
      .map((lang) => `${lang.name} (${lang.level})`)
      .join(" • ");
    parts.push(paragraph(langLine, "body"));
  }

  if (draft.certifications.length > 0) {
    parts.push(paragraph(labels.certifications, "heading"));
    for (const cert of draft.certifications) {
      const line = [cert.title, cert.issuer, cert.year?.toString()]
        .filter(Boolean)
        .join(" — ");
      parts.push(paragraph(line, "body"));
    }
  }

  parts.push(
    `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>`,
  );

  return parts.join("");
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;

export async function generateDocxFromStructured(
  draft: CvImportDraft,
): Promise<Buffer> {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${buildDocumentBody(draft)}</w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.folder("_rels")?.file(".rels", ROOT_RELS);
  zip.folder("word")?.file("document.xml", documentXml);
  zip.folder("word")?.folder("_rels")?.file("document.xml.rels", DOC_RELS);
  zip.folder("word")?.file("styles.xml", STYLES);

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
