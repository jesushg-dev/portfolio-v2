import { processSectionHeadingId } from "./process-page-styles";
import { ProcessSectionHeader } from "./process-section-header";

interface ProcessRolesSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  myRolesLabel: string;
  myRoles: string[];
  ecosystemRoles: string[];
  testingLabel: string;
  testingTags: string[];
}

export function ProcessRolesSection({
  eyebrow,
  title,
  description,
  myRolesLabel,
  myRoles,
  ecosystemRoles,
  testingLabel,
  testingTags,
}: ProcessRolesSectionProps) {
  return (
    <section
      id="roles"
      aria-labelledby={processSectionHeadingId("roles")}
      className="bg-muted/50 px-6 py-20"
    >
      <div className="mx-auto max-w-4xl text-center">
        <ProcessSectionHeader
          sectionId="roles"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <p id="roles-my-roles" className="sr-only">
          {myRolesLabel}
        </p>
        <ul
          aria-labelledby="roles-my-roles"
          className="mb-10 flex list-none flex-wrap justify-center gap-3"
        >
          {myRoles.map((role) => (
            <li key={role}>
              <span className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold">
                {role}
              </span>
            </li>
          ))}
          {ecosystemRoles.map((role) => (
            <li key={role}>
              <span className="border-border text-muted-foreground inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm">
                {role}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-widest uppercase">
          {testingLabel}
        </p>
        <ul className="flex list-none flex-wrap justify-center gap-3">
          {testingTags.map((tag) => (
            <li key={tag}>
              <span className="bg-card ring-border/60 text-foreground inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm ring-1">
                {tag}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
