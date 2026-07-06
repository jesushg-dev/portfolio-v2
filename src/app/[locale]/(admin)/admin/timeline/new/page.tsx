import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";
import { db } from "@/server/db";

export default async function NewTimelineItemPage() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Timeline Entry
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new item to your timeline.
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <TimelineItemForm  languages={languages} />
      </div>
    </div>
  );
}
