import React, { useImperativeHandle, useState, useRef } from 'react';

export type ValidityType = 'idle' | 'success' | 'error';

export interface IInputRef {
  focus: () => void;
  clear: () => void;
  value: () => string;
  scrollIntoView: () => void;
  setErrorMessage: (message: string) => void;
  setSuccessMessage: (message: string) => void;
}

const useRefInput = (ref: React.ForwardedRef<IInputRef>) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState<ValidityType>('idle');

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
        setSuccessMessage: (message: string) => {
          setError('success');
          setMessage(message);
        },
        setErrorMessage: (message: string) => {
          setError('error');
          setMessage(message);
          inputRef.current?.setCustomValidity(message);
        },
        value: () => {
          return inputRef.current?.value || '';
        },
        clear: () => {
          setMessage('');
          setError('idle');
          inputRef.current?.setCustomValidity('');
          inputRef.current?.value && (inputRef.current.value = '');
        },
      };
    },
    [inputRef]
  );

  return { inputRef, error, message };
};

export default useRefInput;
