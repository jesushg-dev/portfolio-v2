import type { AppRouter } from "@/server/api/root";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export type localeType = "en" | "es";
export type RouterOutputType = inferRouterOutputs<AppRouter>;

export type SkillsOutputTypes = RouterOutputType["portfolio"]["getSkills"];
export type SkillsInputTypes =
  inferRouterInputs<AppRouter>["portfolio"]["getSkills"];
export type SkillType = SkillsOutputTypes[0];
export type SkillTypeType = SkillType["type"];
export type SkillDetailType = NonNullable<
  RouterOutputType["portfolio"]["getSkillBySlug"]
>;

export type ProjectsOutputTypes =
  RouterOutputType["portfolio"]["getProjects"]["projects"];
export type ProjectsInputTypes =
  inferRouterInputs<AppRouter>["portfolio"]["getProjects"];
export type ProjectType = ProjectsOutputTypes[0];

export type CertificatesOutputTypes =
  RouterOutputType["portfolio"]["getCertificates"]["certificates"];
export type CertificatesInputTypes =
  inferRouterInputs<AppRouter>["portfolio"]["getCertificates"];
export type CertificateType = CertificatesOutputTypes[0];
