import { readFileSync, writeFileSync } from "node:fs";

import { matchCertificationSkillKeys } from "../lib/match-certification-skills";

const skills = JSON.parse(
  readFileSync("prisma/data/portfolio-skills.json", "utf8"),
) as { key: string; title: string }[];

const certifications = JSON.parse(
  readFileSync("prisma/data/portfolio-certifications.json", "utf8"),
) as {
  key: string;
  translations: { locale: string; title: string }[];
  type: string;
  skillKeys: string[];
}[];

const updated = certifications.map((certification) => ({
  ...certification,
  skillKeys: matchCertificationSkillKeys(certification, skills),
}));

writeFileSync(
  "prisma/data/portfolio-certifications.json",
  `${JSON.stringify(updated, null, 2)}\n`,
);

const withSkills = updated.filter((cert) => cert.skillKeys.length > 0).length;
console.log(
  `Updated ${updated.length} certifications (${withSkills} with skills)`,
);
