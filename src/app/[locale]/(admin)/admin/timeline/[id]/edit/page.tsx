import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditTimelineItemPage({ params }: Props) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const timelineItemDelegate = (db as { timelineItem?: typeof db.timelineItem })
    .timelineItem;

  if (!timelineItemDelegate) {
    notFound();
  }

  const experience = await timelineItemDelegate.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!experience) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Timeline Entry
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update an existing item in your timeline.
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <TimelineItemForm initialData={experience}  languages={languages} />
      </div>
    </div>
  );
}
