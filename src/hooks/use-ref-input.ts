import type React from "react";
import { useImperativeHandle, useState, useRef, useCallback } from "react";

export type ValidityType = "idle" | "success" | "error";

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

  const [message, setMessage] = useState("");
  const [error, setError] = useState<ValidityType>("idle");

  const setSuccessMessage = useCallback((newMessage: string) => {
    setError("success");
    setMessage(newMessage);
  }, []);

  const setErrorMessage = useCallback((newMessage: string) => {
    setError("error");
    setMessage(newMessage);
    inputRef.current?.setCustomValidity(newMessage);
  }, []);

  const clear = useCallback(() => {
    setMessage("");
    setError("idle");

    inputRef.current?.setCustomValidity("");
    if (inputRef.current?.value) {
      inputRef.current.value = "";
    }
  }, []);

  const value = useCallback(() => {
    return inputRef.current?.value ?? "";
  }, []);

  const scrollIntoView = useCallback(() => {
    inputRef.current?.scrollIntoView();
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useImperativeHandle(ref, () => {
    return {
      focus,
      clear,
      value,
      scrollIntoView,
      setErrorMessage,
      setSuccessMessage,
    };
  }, [focus, clear, value, scrollIntoView, setErrorMessage, setSuccessMessage]);

  return { inputRef, error, message };
};

export default useRefInput;
