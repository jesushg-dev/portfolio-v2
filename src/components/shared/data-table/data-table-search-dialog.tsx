"use client";

import { useId, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  description: string;
}

export function DataTableSearchDialog({
  value,
  onChange,
  description,
}: DataTableSearchProps) {
  const t = useTranslations("admin.dataTable.searchDialog");
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraft(value);
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-w-full min-w-0"
          />
        }
        aria-label={value ? t("active", { query: value }) : t("open")}
      >
        <Search aria-hidden />
        <span className="max-w-40 truncate">{value || t("open")}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onChange(draft.trim());
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={inputId}>{t("label")}</Label>
            <Input
              id={inputId}
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("placeholder")}
              maxLength={200}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={!value && !draft}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit">{t("apply")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
