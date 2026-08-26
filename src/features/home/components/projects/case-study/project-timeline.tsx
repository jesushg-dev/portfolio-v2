"use client";

interface TimelinePhase {
  title: string;
  description?: string;
  date?: string;
}

interface ProjectTimelineProps {
  phases: TimelinePhase[];
}

export function ProjectTimeline({ phases }: ProjectTimelineProps) {
  if (!phases || phases.length === 0) return null;

  return (
    <div className="relative pl-6">
      <div className="bg-border absolute top-0 bottom-0 left-2.75 w-0.5" />
      <div className="space-y-8">
        {phases.map((phase, i) => (
          <div key={i} className="relative">
            <div className="bg-primary absolute top-1 -left-6 h-5.5 w-5.5 rounded-full border-4 border-white shadow-sm dark:border-gray-900" />
            <div className="ml-4">
              <div className="flex items-baseline gap-3">
                <h4 className="text-foreground font-semibold">{phase.title}</h4>
                {phase.date && (
                  <span className="text-muted-foreground text-xs">
                    {phase.date}
                  </span>
                )}
              </div>
              {phase.description && (
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {phase.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
