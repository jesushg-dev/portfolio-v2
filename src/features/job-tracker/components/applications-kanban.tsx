"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";

import { api, type RouterOutputs } from "@/trpc/react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CelebrationAnimation } from "@/components/celebration-animation";
import type { ApplicationStatus } from "@/features/job-tracker/types";
import {
  KANBAN_COLUMNS,
  kanbanColumnStyles,
} from "@/features/job-tracker/lib/constants";
import {
  APPLIED_STALE_DAYS,
  GHOST_ARCHIVE_DAYS,
  GHOST_NUDGE_SNOOZE_DAYS,
  isArchivedGhost,
  isSuggestedGhost,
} from "@/features/job-tracker/lib/stale-application";
import { cn } from "@/lib/utils";

type ApplicationRow =
  RouterOutputs["jobTrackerAdmin"]["getApplications"]["data"][number];

type KanbanColumns = Record<ApplicationStatus, ApplicationRow[]>;

interface ApplicationsKanbanProps {
  initialApplications: ApplicationRow[];
  totalCount: number;
}

function buildKanbanColumns(applications: ApplicationRow[]): KanbanColumns {
  const columns = Object.fromEntries(
    KANBAN_COLUMNS.map((status) => [status, [] as ApplicationRow[]]),
  ) as KanbanColumns;

  for (const application of applications) {
    columns[application.status].push(application);
  }

  return columns;
}

function getCompanyInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export const ApplicationsKanban: FC<ApplicationsKanbanProps> = ({
  initialApplications,
  totalCount,
}) => {
  const t = useTranslations("admin.jobTracker");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const [overrideColumns, setOverrideColumns] = useState<KanbanColumns | null>(
    null,
  );
  const [showArchivedGhosts, setShowArchivedGhosts] = useState(false);
  const [enabledStatuses, setEnabledStatuses] = useState<
    Set<ApplicationStatus>
  >(() => new Set(KANBAN_COLUMNS));
  const [ghostDialogOpen, setGhostDialogOpen] = useState(false);
  const [selectedGhostIds, setSelectedGhostIds] = useState<string[]>([]);
  const [snoozeDays, setSnoozeDays] = useState(GHOST_NUDGE_SNOOZE_DAYS);
  const [celebration, setCelebration] = useState<{
    companyName: string;
    position: string;
  } | null>(null);

  const { data: { data: applications } = { data: initialApplications } } =
    api.jobTrackerAdmin.getApplications.useQuery(
      { page: 1, perPage: Math.max(totalCount, 100), sort: [], filters: [] },
      {
        placeholderData: {
          data: initialApplications,
          pageCount: 1,
          totalCount,
        },
      },
    );

  const archivedGhosts = useMemo(
    () => applications.filter((application) => isArchivedGhost(application)),
    [applications],
  );
  const suggestedGhosts = useMemo(
    () => applications.filter((application) => isSuggestedGhost(application)),
    [applications],
  );

  const visibleApplications = useMemo(
    () =>
      applications.filter((application) => {
        if (!enabledStatuses.has(application.status)) return false;
        if (!showArchivedGhosts && isArchivedGhost(application)) return false;
        return true;
      }),
    [applications, enabledStatuses, showArchivedGhosts],
  );
  const hiddenCount = applications.length - visibleApplications.length;

  const serverColumns = useMemo(
    () => buildKanbanColumns(visibleApplications),
    [visibleApplications],
  );
  const columns = overrideColumns ?? serverColumns;

  const updateStatus =
    api.jobTrackerAdmin.updateApplicationStatus.useMutation();

  const updateStatuses =
    api.jobTrackerAdmin.updateApplicationStatuses.useMutation();
  const snoozeGhostNudge = api.jobTrackerAdmin.snoozeGhostNudge.useMutation();

  const persistStatusChange = useCallback(
    (applicationId: string, status: ApplicationStatus) => {
      startTransition(async () => {
        try {
          await updateStatus.mutateAsync({ id: applicationId, status });
          if (status === "HIRED") {
            const app = applications.find((item) => item.id === applicationId);
            if (app) {
              setCelebration({
                companyName: app.company.name,
                position: app.position,
              });
            }
          }
          setOverrideColumns(null);
          await Promise.all([
            utils.jobTrackerAdmin.getApplications.invalidate(),
            utils.jobTrackerAdmin.getDashboardStats.invalidate(),
          ]);
        } catch {
          setOverrideColumns(null);
          toast.error(t("kanban.statusUpdateError"));
        }
      });
    },
    [applications, t, updateStatus, utils],
  );

  const toggleStatusFilter = useCallback((status: ApplicationStatus) => {
    setEnabledStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) {
        if (next.size === 1) return current;
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const clearBoardFilters = useCallback(() => {
    setEnabledStatuses(new Set(KANBAN_COLUMNS));
    setShowArchivedGhosts(true);
  }, []);

  const dismissGhostNudge = useCallback(() => {
    const ids = suggestedGhosts.map((application) => application.id);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await snoozeGhostNudge.mutateAsync({ ids, days: snoozeDays });
        setGhostDialogOpen(false);
        toast.success(t("kanban.ghostNudgeSnoozed", { days: snoozeDays }));
        await utils.jobTrackerAdmin.getApplications.invalidate();
      } catch {
        toast.error(t("kanban.statusUpdateError"));
      }
    });
  }, [snoozeDays, snoozeGhostNudge, suggestedGhosts, t, utils]);

  const openGhostDialog = useCallback(() => {
    setSelectedGhostIds(suggestedGhosts.map((application) => application.id));
    setGhostDialogOpen(true);
  }, [suggestedGhosts]);

  const confirmGhostMove = useCallback(() => {
    if (selectedGhostIds.length === 0) return;
    startTransition(async () => {
      try {
        await updateStatuses.mutateAsync({
          ids: selectedGhostIds,
          status: "GHOSTED",
        });
        setGhostDialogOpen(false);
        setOverrideColumns(null);
        toast.success(
          t("kanban.ghostNudgeSuccess", { count: selectedGhostIds.length }),
        );
        await Promise.all([
          utils.jobTrackerAdmin.getApplications.invalidate(),
          utils.jobTrackerAdmin.getDashboardStats.invalidate(),
        ]);
      } catch {
        toast.error(t("kanban.statusUpdateError"));
      }
    });
  }, [selectedGhostIds, t, updateStatuses, utils]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const applicationId = String(event.active.id);
      if (KANBAN_COLUMNS.includes(applicationId as ApplicationStatus)) return;

      const application = applications.find(
        (item) => item.id === applicationId,
      );
      if (!application) return;

      const nextStatus = KANBAN_COLUMNS.find((status) =>
        columns[status].some((item) => item.id === applicationId),
      );

      if (!nextStatus || nextStatus === application.status) {
        setOverrideColumns(null);
        return;
      }

      persistStatusChange(applicationId, nextStatus);
    },
    [applications, columns, persistStatusChange],
  );

  const handleValueChange = useCallback(
    (nextColumns: Record<string, ApplicationRow[]>) => {
      setOverrideColumns(nextColumns as KanbanColumns);
    },
    [],
  );

  const activeApplication = useMemo(() => {
    const flat = KANBAN_COLUMNS.flatMap((status) => columns[status]);
    return new Map(flat.map((app) => [app.id, app]));
  }, [columns]);

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <div className="flex flex-col gap-2">
        <ButtonGroup
          aria-label={t("kanban.statusFilterAria")}
          className="flex-wrap"
        >
          {KANBAN_COLUMNS.map((status) => {
            const selected = enabledStatuses.has(status);
            return (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => toggleStatusFilter(status)}
              >
                {t(`status.${status}`)}
              </Button>
            );
          })}
        </ButtonGroup>

        {hiddenCount > 0 ? (
          <p className="text-muted-foreground text-xs">
            {t("kanban.hiddenCount", { count: hiddenCount })}
            {!showArchivedGhosts && archivedGhosts.length > 0
              ? ` · ${t("kanban.hiddenGhosts", {
                  count: archivedGhosts.length,
                  days: GHOST_ARCHIVE_DAYS,
                })}`
              : null}{" "}
            <button
              type="button"
              className="text-foreground underline-offset-2 hover:underline"
              onClick={clearBoardFilters}
            >
              {t("kanban.showHidden")}
            </button>
          </p>
        ) : null}

        {suggestedGhosts.length > 0 ? (
          <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
            <p className="text-muted-foreground min-w-0">
              {t("kanban.ghostNudge", {
                count: suggestedGhosts.length,
                days: APPLIED_STALE_DAYS,
              })}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Label
                htmlFor="ghost-snooze-days"
                className="text-muted-foreground text-xs whitespace-nowrap"
              >
                {t("kanban.ghostNudgeSnoozeLabel")}
              </Label>
              <Input
                id="ghost-snooze-days"
                type="number"
                min={1}
                max={90}
                value={snoozeDays}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setSnoozeDays(
                    Number.isFinite(next)
                      ? Math.min(90, Math.max(1, Math.round(next)))
                      : GHOST_NUDGE_SNOOZE_DAYS,
                  );
                }}
                className="h-8 w-16"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={dismissGhostNudge}
              >
                {t("kanban.ghostNudgeLater")}
              </Button>
              <Button type="button" size="sm" onClick={openGhostDialog}>
                {t("kanban.ghostNudgeReview")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Kanban
        value={columns}
        onValueChange={handleValueChange}
        onDragEnd={handleDragEnd}
        getItemValue={(item) => item.id}
        orientation="horizontal"
      >
        <KanbanBoard className="min-h-[380px] flex-1 gap-4 overflow-x-auto pb-1">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              value={status}
              className="bg-muted/25 border-border w-[272px] shrink-0 gap-3 rounded-xl border p-3"
            >
              <KanbanColumnHeader
                label={t(`status.${status}`)}
                count={columns[status].length}
                dotClassName={kanbanColumnStyles[status].dot}
              />

              <div className="flex min-h-[200px] flex-1 flex-col gap-2">
                {columns[status].map((application) => (
                  <KanbanItem
                    key={application.id}
                    value={application.id}
                    className={cn(
                      "group bg-card text-card-foreground border-border overflow-hidden rounded-lg border border-l-[3px] shadow-sm",
                      kanbanColumnStyles[status].accent,
                    )}
                  >
                    <div className="flex items-start gap-2 p-3">
                      <KanbanItemHandle
                        className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                        aria-label={t("kanban.dragCard")}
                      >
                        <GripVertical className="size-4" aria-hidden />
                      </KanbanItemHandle>

                      <Link
                        href={{
                          pathname: "/admin/job-tracker/applications/[id]",
                          params: { id: application.id },
                        }}
                        className="min-w-0 flex-1 space-y-1.5"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
                              kanbanColumnStyles[status].avatar,
                            )}
                          >
                            {getCompanyInitial(application.company.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
                              {application.position}
                            </p>
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              {application.company.name}
                              {application.salary
                                ? ` · ${application.salary}`
                                : null}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div
                      className="border-border/70 bg-muted/20 border-t px-3 py-2 md:hidden"
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Select
                        value={application.status}
                        onValueChange={(nextStatus) => {
                          if (nextStatus === application.status) return;
                          persistStatusChange(application.id, nextStatus!);
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={t("kanban.moveToColumn")}
                          className="bg-background h-8 w-full text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KANBAN_COLUMNS.map((columnStatus) => (
                            <SelectItem key={columnStatus} value={columnStatus}>
                              {t(`status.${columnStatus}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </KanbanItem>
                ))}

                {columns[status].length === 0 ? (
                  <div className="border-border/70 text-muted-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs">
                    {t("kanban.emptyColumn")}
                  </div>
                ) : null}
              </div>

              {status === "APPLIED" ? (
                <Link
                  href="/admin/job-tracker/applications/new"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-muted-foreground hover:text-foreground w-full border border-dashed",
                  )}
                >
                  <Plus className="mr-1.5 size-4" aria-hidden />
                  {t("kanban.addApplication")}
                </Link>
              ) : null}
            </KanbanColumn>
          ))}
        </KanbanBoard>

        <KanbanOverlay>
          {({ value }) => {
            const application = activeApplication.get(String(value));
            if (!application) return null;

            const status = KANBAN_COLUMNS.find((columnStatus) =>
              columns[columnStatus].some((item) => item.id === application.id),
            );

            return (
              <div
                className={cn(
                  "bg-card text-card-foreground w-72 overflow-hidden rounded-lg border border-l-[3px] p-3 shadow-lg",
                  status
                    ? kanbanColumnStyles[status].accent
                    : "border-l-primary",
                )}
              >
                <p className="text-sm font-medium">{application.position}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {application.company.name}
                </p>
              </div>
            );
          }}
        </KanbanOverlay>
      </Kanban>

      {isPending ? (
        <p className="text-muted-foreground text-xs">{t("kanban.updating")}</p>
      ) : null}

      {celebration ? (
        <CelebrationAnimation
          show
          onComplete={() => setCelebration(null)}
          companyName={celebration.companyName}
          position={celebration.position}
        />
      ) : null}

      <Dialog open={ghostDialogOpen} onOpenChange={setGhostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("kanban.ghostNudgeTitle")}</DialogTitle>
            <DialogDescription>
              {t("kanban.ghostNudgeDescription", { days: APPLIED_STALE_DAYS })}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {suggestedGhosts.map((application) => {
              const checked = selectedGhostIds.includes(application.id);
              return (
                <li key={application.id} className="flex items-start gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      setSelectedGhostIds((current) =>
                        value
                          ? [...current, application.id]
                          : current.filter((id) => id !== application.id),
                      );
                    }}
                    aria-label={application.position}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{application.position}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {application.company.name}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGhostDialogOpen(false)}
            >
              {t("kanban.ghostNudgeLater")}
            </Button>
            <Button
              type="button"
              disabled={selectedGhostIds.length === 0 || isPending}
              onClick={confirmGhostMove}
            >
              {t("kanban.ghostNudgeConfirm", {
                count: selectedGhostIds.length,
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function KanbanColumnHeader({
  label,
  count,
  dotClassName,
}: {
  label: string;
  count: number;
  dotClassName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dotClassName)} aria-hidden />
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs tabular-nums">
        {count}
      </span>
    </div>
  );
}
