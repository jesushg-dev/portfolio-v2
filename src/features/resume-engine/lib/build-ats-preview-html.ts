import type { LocalizedCvData } from "@/components/curriculum-vitae/types";
import type { Locale } from "@/i18n/config";
import { groupConsecutiveExperiencesByCompany } from "@/lib/cv/group-consecutive-experiences-by-company";

export interface AtsPreviewLabels {
  present: string;
  aboutMe: string;
  experience: string;
  technicalSkills: string;
  education: string;
  languages: string;
  personalSkills: string;
  additionalInformation: string;
  personalReferences: string;
  certifications: string;
}

export const ATS_PREVIEW_LABELS: Record<Locale, AtsPreviewLabels> = {
  en: {
    present: "Present",
    aboutMe: "About me",
    experience: "Experience",
    technicalSkills: "Technical skills",
    education: "Education",
    languages: "Languages",
    personalSkills: "Soft skills",
    additionalInformation: "Additional information",
    personalReferences: "References",
    certifications: "Certifications",
  },
  es: {
    present: "Actualidad",
    aboutMe: "Sobre mí",
    experience: "Experiencia",
    technicalSkills: "Habilidades técnicas",
    education: "Educación",
    languages: "Idiomas",
    personalSkills: "Habilidades personales",
    additionalInformation: "Información adicional",
    personalReferences: "Referencias",
    certifications: "Certificaciones",
  },
  nl: {
    present: "Heden",
    aboutMe: "Over mij",
    experience: "Ervaring",
    technicalSkills: "Technische vaardigheden",
    education: "Opleiding",
    languages: "Talen",
    personalSkills: "Persoonlijke vaardigheden",
    additionalInformation: "Aanvullende informatie",
    personalReferences: "Referenties",
    certifications: "Certificeringen",
  },
};

const SKILL_CATEGORY_LABELS: Record<string, string> = {
  FRONTEND: "Front-end",
  BACKEND: "Back-end",
  DATABASE: "Databases",
  TOOLS: "Tools",
  MOBILE: "Mobile",
  DESKTOP: "Desktop",
  DEVOPS: "DevOps",
  CYBERSECURITY: "Cybersecurity",
  OTHER: "Other",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatExperienceDateRange(
  startDate: Date | null,
  endDate: Date | null,
  current: boolean,
  presentLabel: string,
): string {
  const fmt = (d: Date) => {
    const month = d.toLocaleString("en-US", { month: "long" });
    return `${month} ${d.getFullYear()}`;
  };
  if (!startDate && !endDate) return "";
  const start = startDate ? fmt(startDate) : "";
  const end = current ? presentLabel : endDate ? fmt(endDate) : "";
  return [start, end].filter(Boolean).join(" – ");
}

function section(title: string, inner: string): string {
  return `<section style="margin-top:20px">
    <h2 style="border-bottom:1px solid #1e40af;padding-bottom:4px;font-size:14px;font-weight:700;letter-spacing:.04em;color:#1e40af;text-transform:uppercase">${escapeHtml(title)}</h2>
    <div style="margin-top:8px">${inner}</div>
  </section>`;
}

export function buildAtsPreviewHtml(input: {
  data: LocalizedCvData;
  aboutMeText: string | null;
  labels: AtsPreviewLabels;
}): string {
  const { data, aboutMeText, labels } = input;
  const fullName = escapeHtml(
    data.header?.fullName ?? data.profile?.displayName ?? "Unknown",
  );
  const degree = escapeHtml(data.header?.degree ?? "");
  const contactLine = escapeHtml(
    data.contacts.map((c) => c.value).join("   |   "),
  );
  const groups = groupConsecutiveExperiencesByCompany(data.experiences);

  const parts: string[] = [];
  parts.push(`<header style="text-align:center">
    <h1 style="font-size:24px;font-weight:700;letter-spacing:-.02em;margin:0">${fullName}</h1>
    ${degree ? `<p style="margin:4px 0 0;font-size:16px;font-style:italic;color:#404040">${degree}</p>` : ""}
    ${contactLine ? `<p style="margin:8px 0 0;font-size:12px;color:#404040">${contactLine}</p>` : ""}
  </header>`);

  if (aboutMeText) {
    parts.push(
      section(
        labels.aboutMe,
        `<p style="font-size:12px;line-height:1.5;margin:0">${escapeHtml(aboutMeText)}</p>`,
      ),
    );
  }

  if (groups.length > 0) {
    const experienceHtml = groups
      .map((group) => {
        const overallDates = formatExperienceDateRange(
          group.overallStart,
          group.overallEnd,
          group.overallCurrent,
          labels.present,
        );
        const single = group.roles.length === 1 ? group.roles[0] : null;
        const dateLabel = single
          ? formatExperienceDateRange(
              single.startDate,
              single.endDate,
              single.current,
              labels.present,
            )
          : overallDates;
        const rolesHtml = (single ? [single] : group.roles)
          .map((exp) => {
            const roleDates = single
              ? ""
              : formatExperienceDateRange(
                  exp.startDate,
                  exp.endDate,
                  exp.current,
                  labels.present,
                );
            const bullets = exp.responsibilities
              .map(
                (r) =>
                  `<li style="font-size:12px;line-height:1.5">${escapeHtml(r.text)}</li>`,
              )
              .join("");
            return `<div style="margin-top:4px">
              <p style="font-size:12px;font-weight:600;font-style:italic;margin:0">${escapeHtml(exp.role)}${roleDates ? ` — ${escapeHtml(roleDates)}` : ""}${exp.location ? ` — ${escapeHtml(exp.location)}` : ""}</p>
              ${bullets ? `<ul style="margin:4px 0 0;padding-left:20px">${bullets}</ul>` : ""}
            </div>`;
          })
          .join("");
        return `<div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;gap:16px;align-items:baseline">
            <h3 style="font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;margin:0">${escapeHtml(group.company)}</h3>
            <span style="font-size:12px;font-weight:600;white-space:nowrap">${escapeHtml(dateLabel)}</span>
          </div>
          ${rolesHtml}
        </div>`;
      })
      .join("");
    parts.push(section(labels.experience, experienceHtml));
  }

  if (data.technicalSkills.length > 0) {
    parts.push(
      section(
        labels.technicalSkills,
        data.technicalSkills
          .map(
            (group) =>
              `<p style="font-size:12px;margin:0 0 4px"><strong>${escapeHtml(SKILL_CATEGORY_LABELS[group.category] ?? group.category)}: </strong>${escapeHtml(group.items.join(", "))}</p>`,
          )
          .join(""),
      ),
    );
  }

  if (data.educations.length > 0) {
    parts.push(
      section(
        labels.education,
        data.educations
          .map((edu) => {
            const years =
              edu.dates ??
              [edu.startYear, edu.endYear].filter(Boolean).join(" – ");
            return `<div style="display:flex;justify-content:space-between;gap:16px;font-size:12px">
              <span><strong>${escapeHtml(edu.degreeName)}</strong>${edu.institution ? ` — ${escapeHtml(edu.institution)}` : ""}${edu.location ? `, ${escapeHtml(edu.location)}` : ""}</span>
              ${years ? `<span style="font-weight:600;white-space:nowrap">${escapeHtml(String(years))}</span>` : ""}
            </div>`;
          })
          .join(""),
      ),
    );
  }

  if (data.languages.length > 0) {
    parts.push(
      section(
        labels.languages,
        `<p style="font-size:12px;margin:0">${data.languages
          .map(
            (lang) =>
              `<strong>${escapeHtml(lang.name)}:</strong> ${escapeHtml(lang.level)}`,
          )
          .join("&nbsp;&nbsp;&nbsp;&nbsp;")}</p>`,
      ),
    );
  }

  if (data.softSkills.length > 0) {
    parts.push(
      section(
        labels.personalSkills,
        `<p style="font-size:12px;margin:0">${escapeHtml(data.softSkills.map((s) => s.name).join(" • "))}</p>`,
      ),
    );
  }

  if (data.additionalInformation.length > 0) {
    parts.push(
      section(
        labels.additionalInformation,
        `<ul style="padding-left:20px">${data.additionalInformation
          .map(
            (info) =>
              `<li style="font-size:12px;line-height:1.5">${escapeHtml(info.text)}</li>`,
          )
          .join("")}</ul>`,
      ),
    );
  }

  if (data.personalReferences.length > 0) {
    parts.push(
      section(
        labels.personalReferences,
        data.personalReferences
          .map(
            (ref) =>
              `<p style="font-size:12px;margin:0"><strong>${escapeHtml(ref.name)}</strong>${ref.role ? ` — ${escapeHtml(ref.role)}` : ""}${ref.contact ? ` — ${escapeHtml(ref.contact)}` : ""}</p>`,
          )
          .join(""),
      ),
    );
  }

  const certifications = data.certifications ?? [];
  if (certifications.length > 0) {
    parts.push(
      section(
        labels.certifications,
        certifications
          .map(
            (cert) =>
              `<p style="font-size:12px;margin:0"><strong>${escapeHtml(cert.title)}</strong>${cert.issuer ? ` — ${escapeHtml(cert.issuer)}` : ""}${cert.year ? ` (${cert.year})` : ""}</p>`,
          )
          .join(""),
      ),
    );
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  #cv-public-preview {
    width: 816px;
    box-sizing: border-box;
    font-family: Georgia, "Times New Roman", serif;
    color: #171717;
    padding: 32px 40px;
  }
</style>
</head>
<body>
  <div id="cv-public-preview">${parts.join("")}</div>
</body></html>`;
}
