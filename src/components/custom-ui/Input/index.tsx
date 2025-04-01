import useRefInput, { type IInputRef } from "@/hooks/use-ref-input";
import React, { forwardRef } from "react";
import {
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

type ErrorState = "error" | "idle" | "success";

const borderColorClasses: Record<ErrorState, string> = {
  error: "border-red-500",
  idle: "border-divider-200",
  success: "border-green-300",
};

interface IInputProps {
  label?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
}

const Input = forwardRef<IInputRef, IInputProps>(
  ({ inputProps, labelProps, label, icon: Icon }, ref) => {
    const { inputRef, error, message } = useRefInput(ref);

    return (
      <div className="space-y-2">
        {label && (
          <label
            {...labelProps}
            htmlFor={inputProps?.id}
            className={`text-primaryText-700 mb-2 text-sm font-bold ${labelProps?.className}`}
          >
            {label}
            {inputProps?.required && (
              <span className="font-normal text-red-500">*</span>
            )}
          </label>
        )}
        <div className="space-y-1">
          <div className="border-background-300 relative">
            {Icon && (
              <button
                type="button"
                title={label}
                onClick={() => inputRef.current?.focus()}
                className="border-background-100 absolute inset-y-0 left-0 flex items-center border-r px-4 py-3"
              >
                <Icon className="text-primaryText-500 h-5 w-5 peer-valid:text-green-400" />
              </button>
            )}

            <input
              {...inputProps}
              ref={inputRef as React.Ref<HTMLInputElement>}
              className={`w-full rounded-sm border ${borderColorClasses[error]} text-primaryText-500 placeholder-divider-200 focus:border-primary-700 bg-transparent px-3 py-3 text-sm shadow-xs focus:outline-hidden ${inputProps?.className}`}
            />
          </div>
          <div
            className={`flex h-4 items-center justify-between ${error === "error" ? "text-red-500" : "text-green-600"}`}
          >
            <p className="text-xs">{message}</p>
            {error === "error" && <IoCloseCircleOutline className="h-4 w-4" />}
            {error === "success" && (
              <IoCheckmarkCircleOutline className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
