# Project content

`ProjectTranslation.title` and `description` provide the project title and summary, including catalog search, metadata and next-project cards. Case-study narrative lives exclusively in `ProjectTranslation.caseStudy`.

Use `caseStudy.sections` for the challenge, approach and results. Each section owns its title, `lead` and items. Constraints are items of the challenge section. Metrics sections render their own `lead`, just like the other section kinds. Galleries and other structured content use `CaseStudyContentSchema`.

The project form preserves the complete case-study DTO when validating saves. Its narrative editor changes section titles and introductions without dropping gallery images, items or other section data.

Catalog highlights come from `caseStudy.tldr`. Project technologies come from `ProjectSkill`. Seeds and exports use this same model, without conversion of retired narrative fields.
