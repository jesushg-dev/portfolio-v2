import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { MediaImage } from "@/components/shared/media-image";
import { Link } from "@/i18n/routing";

import type { ProjectCaseStudyViewProps } from "./case-study-view.types";

export default function CaseStudyNextProject({
  nextProject,
}: {
  nextProject: NonNullable<ProjectCaseStudyViewProps["nextProject"]>;
}) {
  const t = useTranslations("main.portfolio.caseStudy");

  return (
    <div className="mt-24">
      <Link
        href={{
          pathname: "/projects/[slug]",
          params: { slug: nextProject.slug },
        }}
        data-case-study-card
        className="b-card-glow group bg-card border-border hover:border-primary/50 flex w-full flex-col items-stretch gap-6 rounded-4xl border p-6 text-left transition hover:-translate-y-1 hover:shadow-xl md:flex-row md:items-center md:p-8"
      >
        <div className="min-w-0 flex-1">
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            {t("nextProject")}
          </p>
          <p className="mt-3 flex items-center gap-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            {nextProject.title}
            <ArrowUpRight
              className="size-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              aria-hidden="true"
            />
          </p>
          <p className="text-muted-foreground mt-2 max-w-md leading-7">
            {nextProject.summary}
          </p>
        </div>
        <div className="bg-muted border-border relative aspect-[2/1] w-full overflow-hidden rounded-2xl border md:w-72">
          {/* Admin VIS fallback — always underneath */}
          <div className="absolute inset-0 bg-slate-900 p-6" aria-hidden="true">
            <div className="h-full rounded-xl bg-white p-4">
              <div className="flex gap-2">
                <span className="h-4 w-14 rounded-full bg-blue-800" />
                <span className="h-4 w-14 rounded-full bg-slate-200" />
                <span className="h-4 w-14 rounded-full bg-slate-200" />
              </div>
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="mt-3 flex items-center gap-4 rounded-lg border border-slate-200 p-3"
                >
                  <span className="h-6 w-1.5 rounded bg-amber-400" />
                  <span className="h-2.5 w-24 rounded bg-slate-300" />
                  <span className="ml-auto h-5 w-8 rounded bg-yellow-400" />
                  <span className="h-2.5 w-14 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
          {/* Real image on top */}
          {nextProject.image ? (
            <MediaImage
              src={nextProject.image}
              alt={nextProject.title}
              fill
              sizes="(max-width: 768px) 100vw, 288px"
              className="object-cover object-top"
            />
          ) : null}
        </div>
      </Link>
    </div>
  );
}
