"use client";
import { useState, type ReactNode, Fragment } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/shared/form-dialog-content";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type FooterAction = ReactNode;

interface PageBase {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footerActions?: FooterAction[];
}

export const PageCardWrapper = ({
  title,
  description,
  children,
  footerActions = [],
  className,
}: PageBase) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden p-4">
      <Card
        className={cn("flex w-full flex-1 flex-col overflow-hidden", className)}
      >
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>

        <CardContent className="flex flex-1 overflow-hidden">
          {children}
        </CardContent>

        {footerActions.length > 0 && (
          <CardFooter className="flex justify-end gap-2">
            {footerActions.map((action, index) => (
              <Fragment key={index}>{action}</Fragment>
            ))}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export const PageDialogWrapper = ({
  title,
  description,
  children,
  className,
}: PageBase) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.back();
    }, 450);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <FormDialogContent
        title={title}
        description={description}
        className={cn("sm:max-w-5xl", className)}
      >
        {children}
      </FormDialogContent>
    </Dialog>
  );
};

export const PageSheetWrapper = ({
  title,
  description,
  children,
}: PageBase) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => router.back(), 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="sm:max-w-5xl">
        <SheetHeader className="shrink-0 border-b pr-8 pb-4">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-muted-foreground text-sm">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col p-[0.0625rem]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};
