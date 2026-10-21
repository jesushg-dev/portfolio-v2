import type { FC } from "react";

interface ProjectCoverMockupProps {
  type?: string | null;
  title: string;
  slug?: string | null;
}

function cleanSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\|.*$/, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FrontendMockup({
  title,
  slug,
}: {
  title: string;
  slug?: string | null;
}) {
  const displaySlug = slug ? cleanSlug(slug) : cleanSlug(title);

  return (
    <div
      data-mock="frontend"
      className="from-primary/10 via-muted to-muted/80 absolute inset-0 flex justify-center bg-linear-to-br px-6 pt-14"
    >
      <div className="border-border bg-card flex h-full w-full flex-col overflow-hidden rounded-t-xl border border-b-0 shadow-lg">
        {/* Browser Top Bar */}
        <div className="border-border bg-muted/60 flex items-center gap-1.5 border-b px-3 py-2">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
          <span className="border-border/50 bg-card text-muted-foreground ml-2 flex-1 truncate rounded-md border px-2 py-0.5 text-[0.625rem]">
            {displaySlug || "app"}.app
          </span>
        </div>

        {/* Browser Viewport */}
        <div className="flex flex-1 flex-col gap-2.5 p-3">
          <div className="flex items-center justify-between">
            <span className="bg-primary h-2.5 w-10 rounded" />
            <span className="flex gap-1.5">
              <span className="bg-muted-foreground/20 h-1.5 w-7 rounded" />
              <span className="bg-muted-foreground/20 h-1.5 w-7 rounded" />
              <span className="bg-muted-foreground/20 h-1.5 w-7 rounded" />
            </span>
          </div>

          <div className="bg-primary/10 rounded-lg p-3">
            <span className="bg-primary/80 block h-2.5 w-2/3 rounded" />
            <span className="bg-muted-foreground/30 mt-1.5 block h-1.5 w-1/2 rounded" />
            <span className="bg-primary mt-2.5 block h-4 w-16 rounded-md" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="border-border bg-muted/50 block h-8 rounded-lg border" />
            <span className="border-border bg-muted/50 block h-8 rounded-lg border" />
            <span className="border-border bg-muted/50 block h-8 rounded-lg border" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BackendMockup({ title }: { title: string }) {
  const cleanTitle = title.replace(/\s*\|.*$/, "");

  return (
    <div
      data-mock="backend"
      className="from-primary/10 via-muted to-muted/80 absolute inset-0 flex justify-center bg-linear-to-br px-5 pt-14"
    >
      <div className="border-border bg-card flex h-full w-full flex-col overflow-hidden rounded-t-xl border border-b-0 shadow-lg">
        {/* Swagger dark bar */}
        <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 text-white">
          <span className="flex items-center gap-1.5 text-[0.625rem] font-bold">
            <i className="flex size-4 items-center justify-center rounded-full bg-emerald-400 font-mono text-[0.5rem] font-black text-zinc-950 not-italic">
              &#123;&#125;
            </i>
            swagger
          </span>
          <span className="rounded border border-emerald-400 px-1.5 py-0.5 text-[0.5rem] font-bold text-emerald-300">
            Authorize
          </span>
        </div>

        {/* Title bar */}
        <div className="border-border bg-muted/30 flex items-center gap-1.5 border-b px-3 py-2">
          <strong className="text-foreground truncate text-xs font-bold">
            {cleanTitle}
          </strong>
          <span className="bg-muted text-muted-foreground rounded px-1 text-[0.5rem] font-bold">
            v1
          </span>
          <span className="rounded bg-emerald-500 px-1 text-[0.5rem] font-bold text-white">
            OAS 3.0
          </span>
        </div>

        {/* Endpoints */}
        <ul className="flex flex-col gap-1.5 p-3 font-mono text-[0.625rem]">
          <li className="flex items-center gap-2 rounded border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-sky-600">
            <b className="w-9 rounded bg-sky-500 py-0.5 text-center text-white">
              GET
            </b>
            /api/orders
          </li>
          <li className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-600">
            <b className="w-9 rounded bg-emerald-500 py-0.5 text-center text-white">
              POST
            </b>
            /api/orders
          </li>
          <li className="flex items-center gap-2 rounded border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-600">
            <b className="w-9 rounded bg-amber-500 py-0.5 text-center text-white">
              PUT
            </b>
            /api/orders/&#123;id&#125;
          </li>
          <li className="flex items-center gap-2 rounded border border-red-400/30 bg-red-500/10 px-2 py-1 text-red-600">
            <b className="w-9 rounded bg-red-500 py-0.5 text-center text-white">
              DEL
            </b>
            /api/orders/&#123;id&#125;
          </li>
        </ul>
      </div>
    </div>
  );
}

function MobileMockup({ title }: { title: string }) {
  return (
    <div
      data-mock="mobile"
      aria-label={title}
      className="from-primary/10 via-muted to-muted/80 absolute inset-0 flex items-end justify-center gap-3 bg-linear-to-br px-6 pt-14"
    >
      {/* Device 1 */}
      <div className="border-border bg-card h-[78%] w-[27%] max-w-26 rounded-t-2xl border-2 border-b-0 p-1.5 shadow-lg">
        <span className="bg-muted-foreground/30 mx-auto mb-1.5 block h-1 w-6 rounded-full" />
        <span className="bg-primary/20 block h-10 rounded-lg" />
        <div className="mt-2 space-y-1.5">
          <span className="bg-muted-foreground/20 block h-1.5 w-full rounded" />
          <span className="bg-muted-foreground/20 block h-1.5 w-3/4 rounded" />
          <span className="bg-muted-foreground/20 block h-1.5 w-1/2 rounded" />
        </div>
        <span className="bg-primary mt-2.5 block h-3.5 rounded-md" />
      </div>

      {/* Device 2 (hero device) */}
      <div className="border-border bg-card h-[94%] w-[32%] max-w-28 rounded-t-2xl border-2 border-b-0 p-1.5 shadow-xl">
        <span className="bg-muted-foreground/30 mx-auto mb-1.5 block h-1 w-7 rounded-full" />
        <div className="bg-primary flex items-center justify-between rounded-lg px-2 py-1.5">
          <span className="block h-1.5 w-8 rounded bg-white/80" />
          <span className="size-2 rounded-full bg-white/80" />
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="border-border flex items-center gap-1.5 rounded-lg border p-1.5">
            <span className="bg-primary/30 size-4 shrink-0 rounded-md" />
            <span className="flex-1 space-y-1">
              <span className="bg-muted-foreground/20 block h-1.5 w-full rounded" />
              <span className="bg-muted-foreground/20 block h-1.5 w-2/3 rounded" />
            </span>
          </div>
          <div className="border-border flex items-center gap-1.5 rounded-lg border p-1.5">
            <span className="bg-primary/30 size-4 shrink-0 rounded-md" />
            <span className="flex-1 space-y-1">
              <span className="bg-muted-foreground/20 block h-1.5 w-full rounded" />
              <span className="bg-muted-foreground/20 block h-1.5 w-1/2 rounded" />
            </span>
          </div>
        </div>
      </div>

      {/* Device 3 */}
      <div className="border-border bg-card h-[70%] w-[24%] max-w-24 rounded-t-2xl border-2 border-b-0 p-1.5 shadow-lg">
        <span className="bg-muted-foreground/30 mx-auto mb-1.5 block h-1 w-5 rounded-full" />
        <span className="bg-muted/60 block h-8 rounded-lg" />
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <span className="bg-primary/20 block h-5 rounded-md" />
          <span className="bg-primary/20 block h-5 rounded-md" />
          <span className="bg-primary/20 block h-5 rounded-md" />
          <span className="bg-primary/20 block h-5 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function DesktopMockup({ title }: { title: string }) {
  return (
    <div
      data-mock="desktop"
      className="from-primary/10 via-muted to-muted/80 absolute inset-0 flex justify-center bg-linear-to-br px-6 pt-14"
    >
      <div className="border-border bg-card flex h-full w-full flex-col overflow-hidden rounded-t-lg border border-b-0 shadow-lg">
        {/* Title bar */}
        <div className="border-border bg-muted/60 flex items-center justify-between border-b px-2.5 py-1.5">
          <span className="text-muted-foreground truncate text-[0.625rem] font-semibold">
            {title}
          </span>
          <span className="flex gap-1">
            <span className="bg-muted-foreground/30 block h-1.5 w-2.5 rounded-xs" />
            <span className="bg-muted-foreground/30 block h-1.5 w-2.5 rounded-xs" />
            <span className="bg-muted-foreground/30 block h-1.5 w-2.5 rounded-xs" />
          </span>
        </div>

        {/* Window Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="border-border bg-muted/40 w-1/4 space-y-1.5 border-r p-2">
            <span className="bg-muted-foreground/20 block h-2 rounded" />
            <span className="bg-muted-foreground/20 block h-2 rounded" />
            <span className="bg-muted-foreground/20 block h-2 rounded" />
            <span className="bg-primary block h-2 rounded" />
          </aside>

          {/* Table area */}
          <div className="flex-1 p-2.5">
            <div className="flex items-center justify-between">
              <span className="bg-muted-foreground/30 block h-2 w-14 rounded" />
              <span className="bg-primary block h-3.5 w-10 rounded" />
            </div>

            <div className="border-border mt-2 overflow-hidden rounded border">
              <div className="border-border bg-muted/60 grid grid-cols-4 gap-2 border-b p-1.5">
                <span className="bg-muted-foreground/40 block h-1.5 w-full rounded" />
                <span className="bg-muted-foreground/40 block h-1.5 w-full rounded" />
                <span className="bg-muted-foreground/40 block h-1.5 w-full rounded" />
                <span className="bg-muted-foreground/40 block h-1.5 w-full rounded" />
              </div>
              <div className="border-border bg-card grid grid-cols-4 gap-2 border-b p-1.5">
                <span className="bg-muted-foreground/20 block h-1.5 w-full rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-3/4 rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-1/2 rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-2/3 rounded" />
              </div>
              <div className="border-border bg-muted/30 grid grid-cols-4 gap-2 border-b p-1.5">
                <span className="bg-muted-foreground/20 block h-1.5 w-full rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-2/3 rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-3/4 rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-1/2 rounded" />
              </div>
              <div className="bg-card grid grid-cols-4 gap-2 p-1.5">
                <span className="bg-muted-foreground/20 block h-1.5 w-3/4 rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-full rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-1/2 rounded" />
                <span className="bg-muted-foreground/20 block h-1.5 w-2/3 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProjectCoverMockup: FC<ProjectCoverMockupProps> = ({
  type,
  title,
  slug,
}) => {
  const normalizedType = type?.toUpperCase() ?? "FRONTEND";

  switch (normalizedType) {
    case "BACKEND":
    case "CYBERSECURITY":
    case "DEVOPS":
      return <BackendMockup title={title} />;
    case "MOBILE":
      return <MobileMockup title={title} />;
    case "DESKTOP":
      return <DesktopMockup title={title} />;
    case "FRONTEND":
    default:
      return <FrontendMockup title={title} slug={slug} />;
  }
};
