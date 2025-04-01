import useRefInput, { type IInputRef } from "@/hooks/use-ref-input";
import React, { forwardRef, useMemo } from "react";
import {
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

interface ITextAreaProps {
  label?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const TextArea = forwardRef<IInputRef, ITextAreaProps>(
  ({ textareaProps, labelProps, label, icon: Icon }, ref) => {
    const { inputRef, error, message } = useRefInput(ref);

    const textErrorClassName = useMemo(() => {
      if (error === "error") {
        return "border-red-500";
      }
      if (error === "idle") {
        return "border-divider-200";
      }
      return "border-green-300";
    }, [error]);

    return (
      <div className="space-y-2">
        {label && (
          <label
            {...labelProps}
            htmlFor={textareaProps?.id}
            className={`text-primaryText-800 text-sm font-bold ${labelProps?.className}`}
          >
            {label}
            {textareaProps?.required && (
              <span className="font-normal text-red-500">*</span>
            )}
          </label>
        )}
        <div>
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

            <textarea
              {...textareaProps}
              ref={inputRef as React.Ref<HTMLTextAreaElement>}
              className={`w-full resize-none rounded-sm border ${textErrorClassName} text-primaryText-500 placeholder-divider-200 focus:border-primary-700 bg-transparent px-3 py-3 text-sm shadow-xs focus:outline-hidden`}
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

TextArea.displayName = "TextArea";

export default TextArea;
