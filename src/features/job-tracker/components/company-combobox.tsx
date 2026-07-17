"use client";

import { useCallback, useEffect, useMemo, useReducer, type FC } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CompanyEditorDTO } from "@/features/job-tracker/lib/company-editor-dto";
import {
  encodeNewCompanyName,
  resolveCompanyLabel,
} from "@/features/job-tracker/lib/company-combobox";
import { cn } from "@/lib/utils";

interface CompanyComboboxProps {
  id?: string;
  value: string;
  onChange: (companyId: string) => void;
  companies: CompanyEditorDTO[];
  disabled?: boolean;
}

interface ComboboxState {
  open: boolean;
  query: string;
  options: CompanyEditorDTO[];
}

type ComboboxAction =
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "SET_QUERY"; payload: string }
  | { type: "SET_OPTIONS"; payload: CompanyEditorDTO[] }
  | { type: "RESET_QUERY" };

function comboboxReducer(
  state: ComboboxState,
  action: ComboboxAction,
): ComboboxState {
  switch (action.type) {
    case "SET_OPEN":
      return { ...state, open: action.payload };
    case "SET_QUERY":
      return { ...state, query: action.payload };
    case "SET_OPTIONS":
      return { ...state, options: action.payload };
    case "RESET_QUERY":
      return { ...state, query: "" };
    default:
      return state;
  }
}

function matchesName(name: string, query: string, exact = false): boolean {
  return exact
    ? name.toLowerCase() === query.toLowerCase()
    : name.toLowerCase().includes(query.toLowerCase());
}

export const CompanyCombobox: FC<CompanyComboboxProps> = ({
  id,
  value,
  onChange,
  companies,
  disabled = false,
}) => {
  const t = useTranslations("admin.forms.jobTrackerApplication");

  const [state, dispatch] = useReducer(comboboxReducer, {
    open: false,
    query: "",
    options: companies,
  });

  useEffect(() => {
    dispatch({ type: "SET_OPTIONS", payload: companies });
  }, [companies]);

  const selectedLabel = useMemo(
    () => resolveCompanyLabel(value, state.options),
    [state.options, value],
  );

  const trimmedQuery = state.query.trim();

  const filteredCompanies = useMemo(() => {
    if (!trimmedQuery) return state.options;
    return state.options.filter((company) =>
      matchesName(company.name, trimmedQuery),
    );
  }, [state.options, trimmedQuery]);

  const canCreate =
    trimmedQuery.length > 0 &&
    !state.options.some((company) =>
      matchesName(company.name, trimmedQuery, true),
    );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    dispatch({ type: "SET_OPEN", payload: nextOpen });
    if (!nextOpen) {
      dispatch({ type: "RESET_QUERY" });
    }
  }, []);

  const handleSelectExisting = useCallback(
    (companyId: string) => {
      onChange(companyId);
      dispatch({ type: "SET_OPEN", payload: false });
      dispatch({ type: "RESET_QUERY" });
    },
    [onChange],
  );

  const handleSelectNew = useCallback(() => {
    if (!canCreate) return;
    onChange(encodeNewCompanyName(trimmedQuery));
    dispatch({ type: "SET_OPEN", payload: false });
    dispatch({ type: "RESET_QUERY" });
  }, [canCreate, onChange, trimmedQuery]);

  return (
    <Popover open={state.open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={state.open}
            className={cn(
              "border-input bg-background text-foreground h-8 w-full justify-between font-normal",
              !selectedLabel && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {selectedLabel ?? t("placeholders.company")}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--anchor-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("companyCombobox.search")}
            value={state.query}
            onValueChange={(query) =>
              dispatch({ type: "SET_QUERY", payload: query })
            }
          />
          <CommandList>
            {filteredCompanies.length === 0 && !canCreate ? (
              <CommandEmpty>{t("companyCombobox.empty")}</CommandEmpty>
            ) : null}

            <CommandGroup>
              {canCreate ? (
                <CommandItem
                  key={`create-${trimmedQuery}`}
                  value={`create-${trimmedQuery}`}
                  onSelect={handleSelectNew}
                >
                  <Plus className="mr-2 size-4 shrink-0" />
                  <span className="truncate">
                    {t("companyCombobox.create", { name: trimmedQuery })}
                  </span>
                  <button
                    type="button"
                    aria-label={t("companyCombobox.clearSearch")}
                    className="text-muted-foreground hover:text-foreground ml-auto inline-flex"
                    onClick={(event) => {
                      event.stopPropagation();
                      dispatch({ type: "RESET_QUERY" });
                    }}
                  >
                    <X className="size-4" />
                  </button>
                </CommandItem>
              ) : null}

              {filteredCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.id}
                  onSelect={() => handleSelectExisting(company.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      value === company.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{company.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
