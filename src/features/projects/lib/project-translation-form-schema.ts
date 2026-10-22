import { z } from "zod";

import { CaseStudyContentSchema, type CaseStudyContentDTO } from "./case-study";

export const ProjectTranslationFormSchema = z.object({
  title: z.string(),
  description: z.string(),
  // Form values are hydrated DTOs; validate without dropping their structured content.
  caseStudy: z
    .custom<CaseStudyContentDTO>(
      (value) => CaseStudyContentSchema.safeParse(value).success,
    )
    .transform((value) => CaseStudyContentSchema.parse(value)),
});
