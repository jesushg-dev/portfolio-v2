import { processSectionHeadingId } from "./process-page-styles";
import { ProcessReveal } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";

interface ProcessRolesSectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  myRolesLabel: string;
  myRoles: string[];
  ecosystemRolesLabel?: string;
  ecosystemRoles: string[];
  testingLabel: string;
  testingTags: string[];
}

export function ProcessRolesSection({
  id = "roles",
  eyebrow,
  title,
  description,
  myRolesLabel,
  myRoles,
  ecosystemRolesLabel,
  ecosystemRoles,
  testingLabel,
  testingTags,
}: ProcessRolesSectionProps) {
  const displayEcosystemRolesLabel =
    ecosystemRolesLabel?.trim() ?? "I collaborate with";

  return (
    <section
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="border-border/80 border-t px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId={id}
            eyebrow={eyebrow}
            title={title}
            description={description}
          />

          <p className="text-muted-foreground mt-0 mb-4 text-sm font-semibold tracking-widest uppercase">
            {myRolesLabel}
          </p>
          <ul className="mb-14 flex list-none flex-wrap justify-center gap-2">
            {myRoles.map((role) => (
              <li key={role}>
                <span className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-5 py-2 text-sm font-medium">
                  {role}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-widest uppercase">
            {displayEcosystemRolesLabel}
          </p>
          <ul className="mb-14 flex list-none flex-wrap justify-center gap-2">
            {ecosystemRoles.map((role) => (
              <li key={role}>
                <span className="border-border text-muted-foreground inline-flex min-h-11 items-center rounded-full border px-5 py-2 text-sm font-medium">
                  {role}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-widest uppercase">
            {testingLabel}
          </p>
          <ul className="flex list-none flex-wrap justify-center gap-2">
            {testingTags.map((tag) => (
              <li key={tag}>
                <span className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-5 py-2 text-sm font-medium">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </ProcessReveal>
      </div>
    </section>
  );
}
