import React, { forwardRef } from 'react';

import useRefInput, { IInputRef } from '../../../hooks/useRefInput';
import { IoCloseCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

interface ITextAreaProps {
  label?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const TextArea = forwardRef<IInputRef, ITextAreaProps>(({ textareaProps, labelProps, label, icon: Icon }, ref) => {
  const { inputRef, error, message } = useRefInput(ref);

  return (
    <div className="space-y-2">
      {label && (
        <label
          {...labelProps}
          htmlFor={textareaProps?.id}
          className={'text-sm font-bold  text-secondaryText-800 ' + labelProps?.className}>
          {label}
          {textareaProps?.required && <span className="font-normal text-red-500">*</span>}
        </label>
      )}
      <div>
        <div className="relative border-background-300">
          {Icon && (
            <button
              title={label}
              onClick={() => inputRef.current?.focus()}
              className="absolute inset-y-0 left-0 flex items-center border-r border-background-100 px-4 py-3 ">
              <Icon className="h-5 w-5 text-secondaryText-500 peer-valid:text-green-400" />
            </button>
          )}

          <textarea
            {...textareaProps}
            ref={inputRef as any}
            className={`w-full resize-none rounded border ${
              error === 'error' ? 'border-red-500' : error === 'idle' ? 'border-background-400' : 'border-green-300'
            } bg-transparent py-3 px-3 text-sm text-secondaryText-500 placeholder-background-500 shadow-sm focus:border-secondary-700 focus:outline-none`}
          />
        </div>
        <div
          className={`flex h-4 items-center justify-between ${error === 'error' ? 'text-red-500' : 'text-green-600'}`}>
          <p className="text-xs">{message}</p>
          {error === 'error' && <IoCloseCircleOutline className="h-4 w-4" />}
          {error === 'success' && <IoCheckmarkCircleOutline className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
