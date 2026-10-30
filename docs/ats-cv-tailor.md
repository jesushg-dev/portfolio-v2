# Multilingual CV Tailored

CV Tailored uses saved CMS records exclusively. Resume Studio continues to import DOCX/PDF files into editable CMS drafts. Existing exports and their historical source metadata remain readable and downloadable; no stored files are migrated or regenerated.

## Content flow

CMS → job-relevant selection by CMS IDs → localized and tailored selected fields → validated `TailoredResumeDocument` → official Word design → stored DOCX and snapshot → visual preview, ATS DOCX and PDFs.

`targetLocale` is independent of `uiLocale`. An explicit target always wins. Without one, the model detects `en`, `es` or `nl` from the job description. A conflicting model response fails validation; automatic generation gets one correction attempt. Manual generation returns field-specific errors for the pasted JSON. Neither path restores rejected text from a different language.

`resolveTailorContext` loads all three CMS translations, including fallback text for missing translations. The model first chooses relevant experiences and achievements, education, skill items, languages and certifications, then translates only that selection. The complete profile is evidence for selection, not a checklist to print. This does not update CMS records. Structural labels, months and employment types come from the typed `resume-labels.ts` catalog.

## Shared contract

`tailored-resume-document.ts` defines schema version 1, output locale, template ID/revision, header, experiences, education, skills, languages, contacts and certifications. Items and responsibility bullets keep stable CMS IDs. Identity, company/institution names, contacts, dates, skills, photo URL and credential years are copied from CMS, not returned by the model.

Both generation modes accept exactly the same response shape:

```json
{
  "schemaVersion": 1,
  "locale": "en",
  "selection": {
    "experiences": [
      {
        "id": "CMS_EXPERIENCE_ID",
        "responsibilityIds": ["CMS_RESPONSIBILITY_ID"]
      }
    ],
    "educationIds": [],
    "skills": [],
    "languageIds": [],
    "certificationIds": []
  },
  "fields": [
    { "id": "header.degree", "text": "Software Engineer" },
    {
      "id": "header.summary",
      "text": "Computer engineer building accessible web applications."
    },
    { "id": "experience.CMS_EXPERIENCE_ID.role", "text": "Software Engineer" },
    {
      "id": "experience.CMS_EXPERIENCE_ID.bullet.CMS_RESPONSIBILITY_ID",
      "text": "Built accessible React interfaces."
    }
  ],
  "aiScore": 80,
  "matchNotes": "Strong alignment with the role."
}
```

This abbreviated example is illustrative. The manual prompt contains the available records, field inventory and character budgets. Return `selection` with only the IDs and skill items worth including for this job. Every selected record must exist in CMS; duplicate IDs, unknown IDs, skills not in the selected group and achievements belonging to another role are rejected. Preserve source chronology. Each selected experience with available achievements needs at least one selected achievement.

Return populated header/contact-location fields and every populated text field of selected records and achievements exactly once. Omitted records need neither IDs nor translations in `fields`. Empty strings are invalid, including selected certification titles. There is no adapter for the former all-fields/empty-string contract.

Certifications default to none unless they add relevant evidence. v1 allows at most one and v2 at most two; these are ceilings, not quotas. v2 uses additional room primarily for experience and achievements. `requiredCoverage` in each locale's prompt preserves all spoken languages, the first two education records for one-page designs or three for multi-page designs, and balanced core technical categories. Multi-page designs preserve all roles when the role count fits their capacity. Core technical categories require up to three items in multi-page designs or two in one-page designs; additional useful technologies remain selectable. Submitted skill-item and achievement order is preserved; role chronology and category order remain fixed. Tailoring prioritizes achievements and concise descriptions before removing this coverage. The CV editor's technical skills take precedence over the portfolio-wide inventory; the latter is used only when no CV-specific list exists. All records remain in CMS. The persisted snapshot records the full selection in `selection.manifest`, omitted credential IDs in `selection.omittedCertificationIds`, and selection counts in match notes. Visible-text capacity excludes CMS IDs and JSON metadata, for both experience pages and the sidebar.

Validation rejects unknown/duplicate/missing IDs, empty required content, numeric/CEFR changes, unsupported technologies, credential inflation, changed known language/proficiency labels, recognizable foreign-language prose and template capacity overflow. Language and factual checks are deterministic guardrails, not a semantic proof of arbitrary prose: review generated wording before applying. Source facts and proper names remain immutable regardless of model output.

## Word designs

`template-registry.ts` is the sole list of supported designs. It supplies the API enum, interface options, revision, assets, page target, capabilities, per-page experience slots and content budgets. v1 targets one page; v2 targets two.

Each DOCX is editable in Word. In Developer → Properties, preserve the content control **Tag**. Visible sample text can use any language; rendering never locates fields by that text.

- Global fields: `field:header.fullName`, `field:header.degree`, `field:header.summary`, `field:header.availability`, `field:contacts` and `image:photo`.
- Labels use `label:` followed by a typed catalog key, such as `label:experience`.
- Experience blocks use `repeat:experiences:0`, then one block per additional configured page. Their fields are `company`, `role`, `context`, `dates`, `meta` or the compact `companyMeta`; nested `repeat:bullets` contains `field:bullet`. Designs supporting company logos use `image:companyLogo` inside each experience block. `optional:experiences:N` can wrap its continuation page so short profiles do not acquire blank pages.
- Sidebar blocks use `repeat:education`, `repeat:skills`, `repeat:languages` and `repeat:certifications`. Certifications have an `optional:certifications` wrapper so an empty list has no heading.
- Education fields: `degree`, `institution`, `educationDates`. Skill fields: `category`, `items` or `itemsLeft`/`itemsRight`. Language fields: `name`, `level`. Certification field: `certification`.

`render-template.ts` expands semantic controls while preserving the design's paragraph/run styles, tables, section geometry and decorative assets. It inserts CMS contact hyperlinks and the CMS photo, removing unreferenced sample media. Missing required or unknown tags fail clearly; there is no substitute template.

Contact icons are taken from the original design via `icon:TYPE` controls inside the contacts field. Contact values never show URI prefixes such as `mailto:` or `tel:`. Transparent photos are flattened onto white. Company images and bordered monograms occupy the same square drawing with rounded corners; source images retain their aspect ratio within that square. `optional:companyHeader` groups consecutive roles at the same employer without repeating its logo and context within a page. `optional:companyDates` contains `field:companyDates`, the group's earliest start and latest end (or present for an ongoing role); each role retains its own dates. A continuation page repeats the company header with the full group range. Separate stints at the same employer remain separate groups.

`format:companyProgression` scopes the role content whose timeline appears only for companies with multiple consecutive roles. In that scope, Word paragraph styles ending in `-Progression` define the timeline and their corresponding base styles define single-role presentation. The renderer selects the base styles and clears the scope's progression indentation for single-role companies. These styles stay editable in Word. Role/date rows use fixed borderless cells, separated from company tables so Word does not merge their column grids. v2 section headings retain uppercase formatting.

To add a design: create/tag one DOCX, add its registry entry and reference PDF, then run the common renderer tests and visual QA in all three languages. No locale-specific DOCX or version conditionals are required. Character budgets are conservative preflight checks; actual pagination must be verified with Word or a compatible office renderer whenever the design changes.

## API and exports

`getTailorPrompt`, `tailorResume` and `tailorResumeManual` accept `templateVersion`, `jobDescription`, optional `targetLocale`, `uiLocale`, `applicationId` and `tailoredFor`. Automatic mode additionally accepts `provider`; manual mode accepts `rawJson`. The strict schemas reject `sourceType` and `uploadId`.

The canonical document is persisted as `ResumeExport.structuredSnapshot`. Visual DOCX, the ATS preview and ATS DOCX use that same content. ATS omits decorative photography but keeps descriptive text, context, availability, dates and credentials. PDF export converts its respective DOCX through the tenant's iLovePDF integration. Existing historical snapshots have a read-only decoder; they are not accepted as new generation JSON.

Replacing generated files externally was removed from CV Tailored to keep the persisted document and its exports consistent. Import documents through the Resume Studio editor, save changes in CMS, then generate again.

## Verification

Run `pnpm exec jest --runInBand src/features/resume-engine src/features/cv/lib`, `pnpm type`, ESLint on changed files, Prettier and `pnpm build`.

Set `RESUME_QA_OUTPUT=1` while running `tailored-resume-document.test.ts` to write all six visual DOCX, ATS variants and explicit-photo variants into ignored `scratch/resume-qa`. Convert each DOCX to PDF and inspect every page for clipping, links, sample-image leaks, empty blocks and page targets. Test fixtures make no paid AI calls and do not mutate CMS records.

Tailoring includes all CMS achievements, including those marked ATS-only in the editor, as selectable evidence with their original record IDs. Selected achievements enter the same visual and ATS document. Regular CV loading retains the editor visibility setting. Certificate dates are normalized from CMS milliseconds or four-digit years to UTC calendar years before prompting and export. Prompts separate immutable facts from editable field text to avoid duplicating prose, and request an evidence-based score with explicit missing or unverified prerequisites. Listed familiarity alone does not substantiate specialization; language proficiency labels do not establish CEFR equivalence.

## Prompt version and input format

The production prompt exposes `promptVersion` in both system instructions and input metadata. It is independent of the response's `schemaVersion` and must not be returned as an extra response property. Immutable CMS facts are shared once; locale inventories contain editable prose and per-locale coverage. Generation rejects inconsistent immutable facts across locales.

Production uses TOON input for both the copied manual prompt and automatic generation. Model responses remain strict JSON and use the same selection, language, factual and layout validations. The active prompt version is `tailored-cv/2026-10-23.2`. The official TOON encoder is a production dependency.
