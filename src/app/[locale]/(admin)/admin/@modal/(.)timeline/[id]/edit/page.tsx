import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { auth } from "@/lib/auth";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditTimelineItemModal({ params }: Props) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    notFound();
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
    <ModalWrapper
      title="Edit Timeline Entry"
      description="Update an existing item in your timeline"
    >
      <TimelineItemForm initialData={experience} languages={languages} />
    </ModalWrapper>
  );
}
