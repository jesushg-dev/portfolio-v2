"use client";

import * as React from "react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FooterAction = React.ReactNode;

interface PageBase {
  title: string;
  description?: string;
  children: React.ReactNode;
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
              <React.Fragment key={index}>{action}</React.Fragment>
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
      <DialogContent
        className={cn(
          "max-h-[calc(100vh-2rem)]",
          "flex flex-col overflow-hidden bg-white text-gray-900",
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
