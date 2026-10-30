import JSZip from "jszip";

import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import { RESUME_LABELS, resumeDates } from "@/lib/cv/resume-labels";
import { getEmploymentTypeLabel } from "@/features/cv/lib/employment-type";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type ParagraphStyle = "title" | "heading" | "body" | "company" | "subrole";

function paragraph(text: string, style?: ParagraphStyle): string {
  const styleMap: Record<ParagraphStyle, string> = {
    title: "Title",
    heading: "Heading2",
    body: "Normal",
    company: "CompanyGroup",
    subrole: "SubRole",
  };
  const styleXml = style
    ? `<w:pPr><w:pStyle w:val="${styleMap[style]}"/></w:pPr>`
    : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function bullet(text: string, indent = 360): string {
  return `<w:p><w:pPr><w:ind w:left="${indent}"/></w:pPr><w:r><w:t xml:space="preserve">• ${escapeXml(text)}</w:t></w:r></w:p>`;
}

function buildDocumentBody(draft: CvImportDraft): string {
  const parts: string[] = [];
  const locale = draft.detectedLocale;
  const labels = RESUME_LABELS[locale];

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
    const experiences = draft.experiences;

    for (const exp of experiences) {
      const dateLine = resumeDates(exp, locale);
      const employmentTypeLabel = exp.employmentType
        ? getEmploymentTypeLabel(exp.employmentType, locale)
        : null;
      const header = [
        exp.role,
        employmentTypeLabel,
        exp.company,
        dateLine,
        exp.location,
      ]
        .filter(Boolean)
        .join(" — ");
      parts.push(paragraph(header, "company"));
      if (exp.companyBlurb) parts.push(paragraph(exp.companyBlurb, "body"));
      for (const resp of exp.responsibilities) {
        if (resp.trim()) parts.push(bullet(resp, 360));
      }
    }
  }

  if (draft.education.length > 0) {
    parts.push(paragraph(labels.education, "heading"));
    for (const edu of draft.education) {
      const years =
        edu.startYear || edu.endYear
          ? `${edu.startYear ?? ""}${edu.endYear ? ` – ${edu.endYear}` : ""}`
          : (edu.dates ?? "");
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
        paragraph(
          `${labels[group.category]}: ${group.items.join(", ")}`,
          "body",
        ),
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

  if (draft.header.availability) {
    parts.push(
      paragraph(labels.availability, "heading"),
      paragraph(draft.header.availability, "body"),
    );
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
    <w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr><w:keepNext/><w:spacing w:before="120" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CompanyGroup">
    <w:name w:val="Company Group"/>
    <w:pPr><w:keepNext/><w:spacing w:before="120" w:after="40"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="SubRole">
    <w:name w:val="Sub Role"/>
    <w:pPr><w:ind w:left="360"/><w:spacing w:before="40" w:after="20"/></w:pPr>
    <w:rPr><w:i/></w:rPr>
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
