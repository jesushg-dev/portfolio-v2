import { FileText } from "lucide-react";

import { Link } from "@/i18n/routing";

export default function CvUnpublished({
  title,
  description,
  backHome,
}: {
  title: string;
  description: string;
  backHome: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <div className="border-border bg-card flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed p-10">
        <FileText className="text-muted-foreground size-12" aria-hidden />
        <h1 className="text-foreground text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          {backHome}
        </Link>
      </div>
    </div>
  );
}
