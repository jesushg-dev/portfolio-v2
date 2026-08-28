import { type ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircleIcon } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
  type Transition,
} from "motion/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage,
  FormItem as ShadcnFormItem,
} from "@/components/ui/form";
import { PrismaErrorAlert } from "@/components/shared/prisma-error-alert";

import { Hint } from "../hint";

interface FormRootProps extends Omit<
  React.ComponentPropsWithoutRef<"form">,
  "onSubmit"
> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export const FormRoot = ({
  children,
  className,
  onSubmit,
  ...props
}: FormRootProps) => (
  <form
    {...props}
    onSubmit={
      onSubmit
        ? (e) => {
            void onSubmit(e);
          }
        : undefined
    }
    className={cn("flex flex-1 flex-col overflow-hidden", className)}
  >
    {children}
  </form>
);

interface FormContentProps {
  children: ReactNode;
  className?: string;
  error?: unknown;
}

export const FormContent = ({
  children,
  className,
  error,
}: FormContentProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
    <div className={cn("flex flex-col gap-4 px-1 pb-4", className)}>
      <FormError error={error} />
      {children}
    </div>
  </div>
);

interface FormErrorProps {
  error?: unknown;
}

export const FormError = ({ error }: FormErrorProps) => {
  if (!error || typeof error !== "object") return null;
  return <PrismaErrorAlert error={error} />;
};

interface FormSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const FormSection = ({
  children,
  title,
  description,
  className,
}: FormSectionProps) => (
  <fieldset className={cn("space-y-6", className)}>
    {title && <legend className="text-lg font-semibold">{title}</legend>}
    {description && (
      <p className="text-muted-foreground text-sm">{description}</p>
    )}
    <div className="space-y-4">{children}</div>
  </fieldset>
);

export const FormValidationStatus = ({
  isValid,
  validText,
  invalidText,
}: {
  isValid: boolean;
  validText: string;
  invalidText: string;
}) => (
  <div
    className={`flex items-center space-x-2 ${isValid ? "text-green-600" : "text-red-600"}`}
  >
    {isValid ? (
      <CheckCircle2 className="h-5 w-5" />
    ) : (
      <AlertCircle className="h-5 w-5" />
    )}
    <span>{isValid ? validText : invalidText}</span>
  </div>
);

interface AnimationProps {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition?: Transition;
}

interface AnimatedVisibilityProps {
  isVisible: boolean;
  children: ReactNode;
  className?: string;
  animation?: AnimationProps;
  mode?: "sync" | "wait";
}

export const AnimatedVisibility = ({
  isVisible,
  children,
  className,
  animation = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2 },
  },
  mode = "sync",
}: AnimatedVisibilityProps) => (
  <AnimatePresence initial={false} mode={mode}>
    {isVisible && (
      <motion.div
        initial={animation.initial}
        animate={animation.animate}
        exit={animation.exit}
        transition={animation.transition}
        className={className}
        aria-live="polite"
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

interface FormItemProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
  inputId?: string;
  required?: boolean;
}

export const FormItem = ({
  label,
  description,
  children,
  className,
  inputId,
  required,
}: FormItemProps) => (
  <ShadcnFormItem id={inputId} className={className}>
    <FormLabel>
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </FormLabel>
    <FormControl>{children}</FormControl>
    {description && <FormDescription>{description}</FormDescription>}
    <FormMessage />
  </ShadcnFormItem>
);

interface FormCheckboxItemProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const FormCheckboxItem = ({
  label,
  description,
  children,
  className,
}: FormCheckboxItemProps) => (
  <ShadcnFormItem
    className={cn(
      "flex flex-row items-start space-x-3 rounded-md border p-4",
      className,
    )}
  >
    <FormControl>{children}</FormControl>
    <div className="space-y-1 leading-none">
      <FormLabel>{label}</FormLabel>
      {description && <FormDescription>{description}</FormDescription>}
    </div>
    <FormMessage />
  </ShadcnFormItem>
);

interface FormSwitchItemProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  tooltip?: string;
}

export const FormSwitchItem = ({
  label,
  description,
  tooltip,
  icon,
  children,
  className,
}: FormSwitchItemProps) => (
  <ShadcnFormItem
    className={cn("flex items-center justify-between", className)}
  >
    <div className="space-y-0.5">
      <FormLabel className="flex items-center gap-1.5">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
        {tooltip && (
          <Hint label={tooltip}>
            <span className="text-muted-foreground flex h-4 w-4 cursor-help items-center justify-center rounded-full border text-xs">
              ?
            </span>
          </Hint>
        )}
      </FormLabel>
      {description && <FormDescription>{description}</FormDescription>}
    </div>
    <FormControl>{children}</FormControl>
    <FormMessage />
  </ShadcnFormItem>
);

interface FormActionsProps {
  isPending?: boolean;
  title?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  submitId?: string;
}

export const FormActions = ({
  isPending,
  title = "Submit",
  onClick,
  className,
  children,
  submitId,
}: FormActionsProps) => (
  <div
    className={cn(
      "border-border bg-background shrink-0 border-t px-1 pt-4",
      "pb-[max(1rem,env(safe-area-inset-bottom))]",
      "flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
  >
    {children}
    <Button
      id={submitId}
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      className="w-full sm:w-auto"
      size="sm"
      disabled={isPending}
    >
      {title}
      {isPending && <LoaderCircleIcon className="ml-2 animate-spin" />}
    </Button>
  </div>
);
