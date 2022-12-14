import React, { forwardRef, useRef, useImperativeHandle, useState } from 'react';

import { IoCloseCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
//red-400
interface ITextAreaProps {
  label?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

interface ITextAreaRef {
  value: string;
  focus: () => void;
  scrollIntoView: () => void;
  setErrorMessage: (message: string) => void;
}

const TextArea = forwardRef<ITextAreaRef | null, ITextAreaProps>(
  ({ textareaProps, labelProps, label, icon: Icon }, ref) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [error, setError] = useState('idle');
    const [message, setMessage] = useState('');

    const handleFocus = () => {
      textAreaRef.current?.focus();
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          focus: () => {
            textAreaRef.current?.focus();
          },
          scrollIntoView: () => {
            textAreaRef.current?.scrollIntoView();
          },
          setErrorMessage: (message: string) => {
            setMessage(message);
            textAreaRef.current?.setCustomValidity(message);
          },
          value: textAreaRef.current?.value || '',
        };
      },
      []
    );

    return (
      <div className="space-y-2">
        {label && (
          <label
            {...labelProps}
            htmlFor={textareaProps?.id}
            className={'text-sm font-bold  text-gray-800' + labelProps?.className}>
            {label}
            {textareaProps?.required && <span className="font-normal text-red-500">*</span>}
          </label>
        )}
        <div className="relative border-gray-300">
          {Icon && (
            <button
              title={label}
              onClick={handleFocus}
              className="absolute inset-y-0 left-0 flex items-center border-r border-gray-100 px-4 py-3 ">
              <Icon className="h-5 w-5 text-gray-500 peer-valid:text-green-400" />
            </button>
          )}

          <textarea
            {...textareaProps}
            ref={textAreaRef}
            className="w-full resize-none rounded border border-gray-300 bg-transparent py-3 px-3 text-sm text-gray-500 placeholder-gray-500 shadow-sm focus:border-indigo-700 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between pt-1 peer-valid:text-green-400">
          <p className="text-xs">{message}</p>
          {error === 'error' && <IoCloseCircleOutline className="h-4 w-4 text-green-400" />}
          {error === 'success' && <IoCheckmarkCircleOutline className="h-4 w-4 text-red-400" />}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
