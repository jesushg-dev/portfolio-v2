import React, { forwardRef, useMemo } from "react";
import {
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

import type { IInputRef } from "../../../hooks/useRefInput";
import useRefInput from "../../../hooks/useRefInput";

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
            /* eslint-disable react/jsx-props-no-spreading */
            {...labelProps}
            /* eslint-enable react/jsx-props-no-spreading */
            htmlFor={textareaProps?.id}
            className={`text-sm font-bold  text-primaryText-800 ${labelProps?.className}`}
          >
            {label}
            {textareaProps?.required && (
              <span className="font-normal text-red-500">*</span>
            )}
          </label>
        )}
        <div>
          <div className="relative border-background-300">
            {Icon && (
              <button
                type="button"
                title={label}
                onClick={() => inputRef.current?.focus()}
                className="absolute inset-y-0 left-0 flex items-center border-r border-background-100 px-4 py-3 "
              >
                <Icon className="h-5 w-5 text-primaryText-500 peer-valid:text-green-400" />
              </button>
            )}

            <textarea
              /* eslint-disable react/jsx-props-no-spreading */
              {...textareaProps}
              /* eslint-enable react/jsx-props-no-spreading */
              ref={inputRef as any}
              className={`w-full resize-none rounded border ${textErrorClassName} bg-transparent px-3 py-3 text-sm text-primaryText-500 placeholder-divider-200 shadow-sm focus:border-primary-700 focus:outline-none`}
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
