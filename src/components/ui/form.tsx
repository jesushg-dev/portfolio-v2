"use client";
import {
  createContext,
  useContext,
  forwardRef,
  type HTMLAttributes,
  useId,
  useState,
  useEffect,
  type ComponentRef,
  type ComponentPropsWithoutRef,
} from "react";

import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/* ── FormProvider re-export ─────────────────────────────────────────────── */
const Form = FormProvider;

/* ── FormField ──────────────────────────────────────────────────────────── */
interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) throw new Error("useFormField must be inside <FormField>");

  const { id, useExplicitControlId } = itemContext;
  const formItemId = useExplicitControlId ? id : `${id}-form-item`;
  const formDescriptionId = useExplicitControlId
    ? `${id}-description`
    : `${id}-form-item-description`;
  const formMessageId = useExplicitControlId
    ? `${id}-message`
    : `${id}-form-item-message`;
  return {
    id,
    name: fieldContext.name,
    formItemId,
    formDescriptionId,
    formMessageId,
    hasDescription: itemContext.hasDescription,
    setHasDescription: itemContext.setHasDescription,
    ...fieldState,
  };
};

/* ── FormItem ───────────────────────────────────────────────────────────── */
interface FormItemContextValue {
  id: string;
  useExplicitControlId: boolean;
  hasDescription: boolean;
  setHasDescription: (value: boolean) => void;
}

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormItem = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { id?: string }
>(({ className, id: idProp, ...props }, ref) => {
  const generatedId = useId();
  const useExplicitControlId = idProp !== undefined;
  const id = idProp ?? generatedId;
  const [hasDescription, setHasDescription] = useState(false);

  return (
    <FormItemContext.Provider
      value={{ id, useExplicitControlId, hasDescription, setHasDescription }}
    >
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...(idProp ? {} : { id })}
        {...props}
      />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

/* ── FormLabel ──────────────────────────────────────────────────────────── */
const FormLabel = forwardRef<
  ComponentRef<typeof Label>,
  ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

/* ── FormControl ────────────────────────────────────────────────────────── */
const FormControl = forwardRef<
  ComponentRef<typeof Slot>,
  ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const {
    error,
    formItemId,
    formDescriptionId,
    formMessageId,
    hasDescription,
  } = useFormField();

  const describedBy =
    [hasDescription ? formDescriptionId : null, error ? formMessageId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

/* ── FormDescription ────────────────────────────────────────────────────── */
const FormDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { formDescriptionId, setHasDescription } = useFormField();

  useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  if (!children) return null;

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-muted-foreground text-[0.8rem]", className)}
      {...props}
    >
      {children}
    </p>
  );
});
FormDescription.displayName = "FormDescription";

/* ── FormMessage ────────────────────────────────────────────────────────── */
const FormMessage = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-destructive text-[0.8rem] font-medium", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
