import JSZip from "jszip";
import { XMLValidator } from "fast-xml-parser";
import type { ResumeTemplate } from "../template-registry";
import type { TailoredResumeDocument } from "../tailored-resume-document";
import { groupConsecutiveExperiencesByCompany } from "@/lib/cv/group-consecutive-experiences-by-company";
import { createCompanyMonogram } from "./resume-photo";
import {
  RESUME_LABELS,
  resumeDates,
  getEmploymentTypeLabel,
} from "@/lib/cv/resume-labels";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
interface Control {
  start: number;
  end: number;
  tag: string;
  body: string;
}
function controls(xml: string): Control[] {
  const tokens = /<w:sdt(?:\s[^>]*)?>|<\/w:sdt>/g;
  let depth = 0,
    start = 0;
  const result: Control[] = [];
  for (const match of xml.matchAll(tokens)) {
    if (match[0].startsWith("</")) {
      if (--depth < 0) throw new Error("Unbalanced template controls");
      if (depth === 0) {
        const end = match.index + match[0].length;
        const control = xml.slice(start, end);
        const tag = /<w:tag\b[^>]*w:val="([^"]+)"/.exec(control)?.[1];
        const body = /<w:sdtContent\b[^>]*>([\s\S]*)<\/w:sdtContent>/.exec(
          control,
        )?.[1];
        if (!tag || body === undefined)
          throw new Error("Every template control needs a tag and content");
        result.push({ start, end, tag, body });
      }
    } else if (depth++ === 0) start = match.index;
  }
  if (depth) throw new Error("Unclosed template control");
  return result;
}
const FIELD_NAMES = new Set([
  "header.fullName",
  "header.degree",
  "header.summary",
  "header.availability",
  "contacts",
  "company",
  "companyDates",
  "context",
  "role",
  "dates",
  "meta",
  "companyMeta",
  "bullet",
  "degree",
  "institution",
  "educationDates",
  "name",
  "level",
  "category",
  "items",
  "itemsLeft",
  "itemsRight",
  "certification",
]);
export function validateResumeTemplate(
  xml: string,
  template: ResumeTemplate,
): void {
  if (XMLValidator.validate(xml) !== true)
    throw new Error(`Invalid XML in template ${template.id}`);
  const tags: string[] = [];
  const walk = (part: string) => {
    const children = controls(part);
    let outside = part;
    for (const child of [...children].reverse())
      outside = outside.slice(0, child.start) + outside.slice(child.end);
    if (/<w:t(?:\s[^>]*)?>[^<]*[^\s<][^<]*<\/w:t>/.test(outside))
      throw new Error(`Unbound visible text in ${template.id}`);
    for (const child of children) {
      tags.push(child.tag);
      if (child.tag.startsWith("repeat:")) {
        if (
          !/^repeat:(experiences:\d+|bullets|education|languages|skills|certifications)$/.test(
            child.tag,
          )
        )
          throw new Error(`Unknown control ${child.tag}`);
        walk(child.body);
      } else if (
        child.tag === "optional:certifications" ||
        child.tag === "optional:companyHeader" ||
        child.tag === "optional:companyDates" ||
        child.tag === "format:companyProgression" ||
        /^optional:experiences:\d+$/.test(child.tag)
      )
        walk(child.body);
      else if (child.tag.startsWith("field:")) {
        if (!FIELD_NAMES.has(child.tag.slice(6)))
          throw new Error(`Unknown field ${child.tag}`);
      } else if (child.tag.startsWith("label:")) {
        if (!(child.tag.slice(6) in RESUME_LABELS.en))
          throw new Error(`Unknown label ${child.tag}`);
      } else if (
        child.tag !== "image:photo" &&
        child.tag !== "image:companyLogo"
      )
        throw new Error(`Unknown control ${child.tag}`);
    }
  };
  walk(xml);
  if (
    template.capabilities.companyLogos &&
    tags.filter((tag) => tag === "image:companyLogo").length !==
      template.experiencePages.length
  )
    throw new Error(
      `Template ${template.id}: each experience block needs image:companyLogo`,
    );
  for (const required of [
    "field:header.fullName",
    "field:header.degree",
    "field:header.summary",
    "field:header.availability",
    "field:contacts",
    "repeat:education",
    "repeat:languages",
    "repeat:skills",
    "repeat:certifications",
    ...(template.capabilities.photo ? ["image:photo"] : []),
    "label:summary",
    "label:experience",
    "label:education",
    "label:skills",
    "label:languages",
    ...template.experiencePages.map((_, i) => `repeat:experiences:${i}`),
  ]) {
    if (tags.filter((tag) => tag === required).length !== 1)
      throw new Error(`Template ${template.id}: expected one ${required}`);
  }
}

function replaceText(xml: string, text: string): string {
  let first = true;
  return xml.replace(
    /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g,
    (match, sample: string) => {
      if (!sample.trim()) return match;
      const result = first
        ? `<w:t xml:space="preserve">${escapeXml(text)}</w:t>`
        : "<w:t/>";
      first = false;
      return result;
    },
  );
}

type Values = Record<string, string>;
export async function renderResumeTemplate(
  buffer: Buffer,
  document: TailoredResumeDocument,
  template: ResumeTemplate,
  photo?: { data: Buffer; extension: "png" | "jpeg" },
  companyLogos: Record<
    string,
    { data: Buffer; extension: "png" | "jpeg" }
  > = {},
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  if (
    document.templateId !== template.id ||
    document.templateRevision !== template.revision
  )
    throw new Error("Document and template revision do not match");
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("Template has no document.xml");
  validateResumeTemplate(xml, template);
  if (
    document.experiences.length >
    template.experiencePages.reduce((a, b) => a + b, 0)
  )
    throw new Error("Too many experiences for template capacity");
  const labels = RESUME_LABELS[document.locale];
  const companyGroups = groupConsecutiveExperiencesByCompany(
    document.experiences,
  );
  const companyGroupById = new Map(
    companyGroups.flatMap((group) =>
      group.roles.map((role) => [role.id, group] as const),
    ),
  );
  const populatedSections: Record<string, boolean> = {
    summary: Boolean(document.header.summary),
    experience: document.experiences.length > 0,
    education: document.education.length > 0,
    skills: document.skills.length > 0,
    languages: document.languages.length > 0,
    certifications: document.certifications.length > 0,
    availability: Boolean(document.header.availability),
    contact: document.contacts.length > 0,
  };
  const global: Values = {
    "header.fullName": document.header.fullName,
    "header.degree": document.header.degree ?? "",
    "header.summary": document.header.summary ?? "",
    "header.availability": document.header.availability ?? "",
    contacts: document.contacts
      .map((c) =>
        c.type === "CALENDLY" ? `${labels.schedule}: ${c.value}` : c.value,
      )
      .join("  ·  "),
  };
  let pictureId: string | undefined;
  const logoRelationships: Record<string, string> = {};
  const logos = template.capabilities.companyLogos
    ? await Promise.all(
        document.experiences.map(
          async (experience) =>
            [
              experience.id,
              companyLogos[experience.id] ??
                (await createCompanyMonogram(experience.company)),
            ] as const,
        ),
      )
    : [];
  for (const [index, [id, logo]] of logos.entries()) {
    const relationshipId = `rIdResumeLogo${index}`;
    logoRelationships[id] = relationshipId;
    zip.file(`word/media/resume-logo-${index}.${logo.extension}`, logo.data);
    const rels = await zip
      .file("word/_rels/document.xml.rels")!
      .async("string");
    zip.file(
      "word/_rels/document.xml.rels",
      rels.replace(
        "</Relationships>",
        `<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/resume-logo-${index}.${logo.extension}"/></Relationships>`,
      ),
    );
    const types = await zip.file("[Content_Types].xml")!.async("string");
    if (!types.includes(`Extension="${logo.extension}"`))
      zip.file(
        "[Content_Types].xml",
        types.replace(
          "</Types>",
          `<Default Extension="${logo.extension}" ContentType="image/${logo.extension}"/></Types>`,
        ),
      );
  }
  const contactRelationships: string[] = [];
  const contactRuns = document.contacts.map((contact, index) => {
    const value = contact.value.replace(/^(mailto:|tel:)/i, "");
    const href =
      contact.type === "EMAIL"
        ? `mailto:${value}`
        : contact.type === "PHONE"
          ? `tel:${value.replace(/[^\d+]/g, "")}`
          : /^(https?:\/\/)/i.test(value)
            ? value
            : undefined;
    const id = `rIdResumeContact${index}`;
    if (href)
      contactRelationships.push(
        `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(href)}" TargetMode="External"/>`,
      );
    return {
      type: contact.type,
      id: href ? id : undefined,
      text:
        contact.type === "CALENDLY"
          ? labels.schedule
          : contact.type === "PHONE"
            ? value.replace(/,/g, " ")
            : value
                .replace(/^https?:\/\//, "")
                .replace(/^www\.linkedin\.com\/in\//, "linkedin/"),
    };
  });
  if (photo) {
    pictureId = "rIdResumePhoto";
    zip.file(`word/media/resume-photo.${photo.extension}`, photo.data);
    const rels = await zip
      .file("word/_rels/document.xml.rels")!
      .async("string");
    zip.file(
      "word/_rels/document.xml.rels",
      rels.replace(
        "</Relationships>",
        `<Relationship Id="${pictureId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/resume-photo.${photo.extension}"/></Relationships>`,
      ),
    );
    const contentTypes = await zip.file("[Content_Types].xml")!.async("string");
    if (!contentTypes.includes(`Extension="${photo.extension}"`))
      zip.file(
        "[Content_Types].xml",
        contentTypes.replace(
          "</Types>",
          `<Default Extension="${photo.extension}" ContentType="image/${photo.extension}"/></Types>`,
        ),
      );
  }
  function render(
    part: string,
    values: Values = global,
    bullets: string[] = [],
  ): string {
    let output = "",
      cursor = 0;
    for (const control of controls(part)) {
      output += part.slice(cursor, control.start);
      const { tag, body } = control;
      let content = "";
      if (tag.startsWith("field:")) {
        const key = tag.slice(6);
        if (!(key in values))
          throw new Error(`Field ${key} is outside its repeat scope`);
        if (key === "contacts") {
          const icons = new Map(
            controls(body)
              .filter((control) => control.tag.startsWith("icon:"))
              .map((control) => [control.tag.slice(5), control.body]),
          );
          const properties =
            /<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/.exec(body)?.[0] ?? "";
          const runs = contactRuns
            .map((contact, index) => {
              const run = `<w:r>${properties}<w:t xml:space="preserve">${escapeXml(contact.text)}</w:t></w:r>`;
              const text = contact.id
                ? `<w:hyperlink r:id="${contact.id}">${run}</w:hyperlink>`
                : run;
              const separator =
                index === 0
                  ? ""
                  : index % template.contactColumns === 0
                    ? "<w:r><w:br/></w:r>"
                    : `<w:r><w:t xml:space="preserve">   </w:t></w:r>`;
              return (
                separator +
                (icons.get(contact.type) ?? icons.get("WEBSITE") ?? "") +
                `<w:r><w:t xml:space="preserve"> </w:t></w:r>` +
                text
              );
            })
            .join("");
          const paragraphProperties =
            /<w:pPr\b[^>]*>[\s\S]*?<\/w:pPr>/.exec(body)?.[0] ?? "";
          content = `<w:p>${paragraphProperties}${runs}</w:p>`;
        } else content = replaceText(body, values[key]);
      } else if (tag.startsWith("optional:experiences:")) {
        const page = Number(tag.split(":")[2]);
        const start = template.experiencePages
          .slice(0, page)
          .reduce((sum, count) => sum + count, 0);
        content = document.experiences.length > start ? render(body) : "";
      } else if (tag === "optional:companyHeader") {
        content = values.companyHeader ? render(body, values, bullets) : "";
      } else if (tag === "optional:companyDates") {
        content = values.companyDates ? render(body, values, bullets) : "";
      } else if (tag === "format:companyProgression") {
        // Word owns both paragraph styles; only multi-role groups use the timeline.
        const styled = values.companyProgression
          ? body
          : body
              .replace(/<w:ind\b[^>]*\/>/g, "")
              .replace(
                /(<w:pStyle\b[^>]*w:val=")([^"]+)-Progression("[^>]*\/?>)/g,
                "$1$2$3",
              );
        content = render(styled, values, bullets);
      } else if (tag === "optional:certifications")
        content = document.certifications.length ? render(body) : "";
      else if (tag.startsWith("label:"))
        content =
          populatedSections[tag.slice(6)] === false
            ? ""
            : replaceText(
                body,
                /<w:caps(?:\s[^>]*)?\s*\/>/.test(body)
                  ? labels[
                      tag.slice(6) as keyof typeof labels
                    ].toLocaleUpperCase(document.locale)
                  : labels[tag.slice(6) as keyof typeof labels],
              );
      else if (tag === "image:companyLogo")
        content = values.companyLogo
          ? body.replace(/r:embed="[^"]*"/g, `r:embed="${values.companyLogo}"`)
          : "";
      else if (tag === "image:photo")
        content = pictureId
          ? body.replace(/r:embed="[^"]*"/g, `r:embed="${pictureId}"`)
          : body.replace(
              /<w:drawing\b[\s\S]*?<\/w:drawing>|<w:pict\b[\s\S]*?<\/w:pict>/g,
              "",
            );
      else if (tag.startsWith("repeat:experiences:")) {
        const page = Number(tag.split(":")[2]);
        const offset = template.experiencePages
          .slice(0, page)
          .reduce((a, b) => a + b, 0);
        content = document.experiences
          .slice(offset, offset + template.experiencePages[page])
          .map((exp, expIndex) => {
            const group = companyGroupById.get(exp.id)!;
            const hasProgression = group.roles.length > 1;
            const dates = resumeDates(exp, document.locale);
            const meta = [
              exp.employmentType
                ? getEmploymentTypeLabel(exp.employmentType, document.locale)
                : "",
              exp.location,
            ]
              .filter(Boolean)
              .join(" · ");
            return render(
              body,
              {
                ...global,
                company: exp.company,
                companyHeader:
                  expIndex === 0 || group.roles[0].id === exp.id ? "yes" : "",
                companyProgression: hasProgression ? "yes" : "",
                companyDates: hasProgression
                  ? resumeDates(
                      {
                        startDate: group.overallStart?.toISOString(),
                        endDate: group.overallEnd?.toISOString(),
                        current: group.overallCurrent,
                      },
                      document.locale,
                    )
                  : "",
                companyLogo: logoRelationships[exp.id] ?? "",
                context: exp.companyBlurb ?? "",
                role: exp.role,
                dates,
                meta,
                companyMeta: [exp.company, meta, dates]
                  .filter(Boolean)
                  .join(" · "),
              },
              exp.responsibilities,
            );
          })
          .join("");
      } else if (tag === "repeat:bullets")
        content = bullets
          .map((bullet) => render(body, { ...values, bullet }))
          .join("");
      else if (tag === "repeat:education")
        content = document.education
          .map((edu) =>
            render(body, {
              ...global,
              degree: edu.degreeName,
              institution: [edu.institution, edu.location]
                .filter(Boolean)
                .join(" · "),
              educationDates:
                [edu.startYear, edu.endYear].filter(Boolean).join("–") ||
                (edu.dates ?? ""),
            }),
          )
          .join("");
      else if (tag === "repeat:languages")
        content = document.languages
          .map((lang) =>
            render(body, { ...global, name: lang.name, level: lang.level }),
          )
          .join("");
      else if (tag === "repeat:skills")
        content = document.skills
          .map((skill) =>
            render(body, {
              ...global,
              category: labels[skill.category],
              items: skill.items.join(" · "),
              itemsLeft: skill.items.filter((_, i) => i % 2 === 0).join(" · "),
              itemsRight: skill.items.filter((_, i) => i % 2 === 1).join(" · "),
            }),
          )
          .join("");
      else if (tag === "repeat:certifications")
        content = document.certifications
          .map((cert) =>
            render(body, {
              ...global,
              certification: [cert.title, cert.issuer, cert.year]
                .filter(Boolean)
                .join(" · "),
            }),
          )
          .join("");
      output += content;
      cursor = control.end;
    }
    return output + part.slice(cursor);
  }
  let result = render(xml);
  // Repeated blocks require fresh document-wide drawing and bookmark identities.
  let drawingId = 0;
  result = result.replace(
    /(<wp:docPr\b[^>]*\bid=")[^"]*/g,
    (_, prefix: string) => `${prefix}${++drawingId}`,
  );
  result = result.replace(
    /<w:bookmarkStart\b[^>]*\/>|<w:bookmarkEnd\b[^>]*\/>/g,
    "",
  );
  result = result.replace(
    /<w:lang\b[^>]*\/>/g,
    `<w:lang w:val="${document.locale}"/>`,
  );
  zip.file("word/document.xml", result);
  const relsPath = "word/_rels/document.xml.rels";
  const rels = await zip.file(relsPath)!.async("string");
  const cleanedRels = rels
    .replace(/<Relationship\b[^>]*\/>/g, (relationship) => {
      const id = /\bId="([^"]+)"/.exec(relationship)?.[1];
      return /\/image"|\/hyperlink"/.test(relationship) &&
        id &&
        !result.includes(`="${id}"`)
        ? ""
        : relationship;
    })
    .replace(
      "</Relationships>",
      `${contactRelationships.join("")}</Relationships>`,
    );
  zip.file(relsPath, cleanedRels);
  // Discard unreferenced sample media from generated files, including old faces.
  const allRelationships = (
    await Promise.all(
      Object.keys(zip.files)
        .filter((name) => name.endsWith(".rels"))
        .map((name) => zip.file(name)!.async("string")),
    )
  ).join("");
  for (const name of Object.keys(zip.files)) {
    if (
      name.startsWith("word/media/") &&
      !zip.files[name].dir &&
      !allRelationships.includes(name.slice("word/".length))
    )
      zip.remove(name);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}
