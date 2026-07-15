"use client";

import { format } from "date-fns";
import {
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApplicationListRow } from "@/features/job-tracker/types";
import { statusVariants } from "@/features/job-tracker/lib/constants";
import type { ApplicationStatus } from "@/features/job-tracker/types";
import { CelebrationAnimation } from "@/components/celebration-animation";
import type { Locale } from "@/i18n/config";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";

interface ApplicationCardProps {
  application: ApplicationListRow;
  locale: Locale;
  onStatusChange?: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationCard({
  application,
  locale,
  onStatusChange,
}: ApplicationCardProps) {
  const t = useTranslations("admin.jobTracker");
  const {
    id,
    position,
    company,
    status,
    appliedDate,
    salary,
    location,
    notes,
    description,
  } = application;
  const [showCelebration, setShowCelebration] = useState(false);
  const dateFnsLocale = getDateFnsLocale(locale);

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (newStatus === "HIRED") {
      setShowCelebration(true);
    }
    onStatusChange?.(id, newStatus);
  };

  const statusOptions: ApplicationStatus[] = [
    "APPLIED",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "HIRED",
  ];

  return (
    <Link href={`/admin/job-tracker/applications/${id}`} className="block">
      <Card className="w-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{position}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {company.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariants[status]}>
                {t(`status.${status}`)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {statusOptions.map((statusKey) => (
                    <DropdownMenuItem
                      key={statusKey}
                      onClick={(e) => {
                        e.preventDefault();
                        handleStatusChange(statusKey);
                      }}
                      disabled={statusKey === status}
                    >
                      {t("changeStatus", { status: t(`status.${statusKey}`) })}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(appliedDate), "dd MMM yyyy", {
                locale: dateFnsLocale,
              })}
            </div>
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {location}
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {salary}
              </div>
            )}
          </div>

          {description && (
            <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
              <span className="font-medium">{t("detail.jobDescription")}:</span>{" "}
              {description}
            </p>
          )}

          {application.cvFile && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>CV: {application.cvFile.name}</span>
            </div>
          )}

          {notes && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {notes}
            </p>
          )}

          {company.website && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                {t("viewCompany")}
              </Button>
            </div>
          )}
        </CardContent>
        <CelebrationAnimation
          show={showCelebration}
          onComplete={() => setShowCelebration(false)}
          companyName={company.name}
          position={position}
        />
      </Card>
    </Link>
  );
}
