import React, { forwardRef, useRef, useImperativeHandle, useState } from 'react';

import { IoCloseCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
//red-400

interface IInputProps {
  label?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
}

export interface IInputRef {
  value: string;
  focus: () => void;
  scrollIntoView: () => void;
  setErrorMessage: (message: string) => void;
}

const Input = forwardRef<IInputRef | null, IInputProps>(({ inputProps, labelProps, label, icon: Icon }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('idle');
  const [message, setMessage] = useState('');

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  useImperativeHandle(
    ref,
    () => {
      return {
        focus: () => {
          inputRef.current?.focus();
        },
        scrollIntoView: () => {
          inputRef.current?.scrollIntoView();
        },
        setErrorMessage: (message: string) => {
          const error = message === '' ? 'success' : 'error';

          setError(error);
          setMessage(message);
          inputRef.current?.setCustomValidity(message);
        },
        value: inputRef.current?.value || '',
      };
    },
    []
  );

  return (
    <div className="space-y-2">
      {label && (
        <label
          {...labelProps}
          htmlFor={inputProps?.id}
          className={'text-sm font-bold text-gray-800' + labelProps?.className}>
          {label}
          {inputProps?.required && <span className="font-normal text-red-500">*</span>}
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

        <input
          {...inputProps}
          ref={inputRef}
          className={`w-full rounded border border-gray-300 bg-transparent py-3 px-3 text-sm text-gray-500 placeholder-gray-500 shadow-sm focus:border-blue-700 focus:outline-none peer-valid:border-green-400 ${inputProps?.className}`}
        />
      </div>
      <div className="flex items-center justify-between peer-valid:text-green-400">
        <p className="text-xs">{message}</p>
        {error === 'error' && <IoCloseCircleOutline className="h-4 w-4 text-green-400" />}
        {error === 'success' && <IoCheckmarkCircleOutline className="h-4 w-4 text-red-400" />}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
