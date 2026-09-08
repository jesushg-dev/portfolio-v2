"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  item(index: number): { transcript: string; confidence: number };
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultItem>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export type SpeechRecognitionErrorCode =
  "not-allowed" | "audio-capture" | "network" | "unsupported" | "unknown";

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onTranscriptChange?: (text: string) => void;
  onError?: (code: SpeechRecognitionErrorCode) => void;
}

function subscribeToSpeechSupport() {
  return () => {
    /* No-op cleanup: speech recognition availability does not change during session */
  };
}

export function useSpeechRecognition({
  lang = "es-ES",
  onTranscriptChange,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorCode, setErrorCode] = useState<SpeechRecognitionErrorCode | null>(
    null,
  );

  const isSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    () => {
      if (typeof window === "undefined") return false;
      const windowWithSpeech = window as unknown as WindowWithSpeech;
      return Boolean(
        windowWithSpeech.SpeechRecognition ??
        windowWithSpeech.webkitSpeechRecognition,
      );
    },
    () => false,
  );

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const shouldListenRef = useRef(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const reportError = useCallback((code: SpeechRecognitionErrorCode) => {
    setErrorCode(code);
    onErrorRef.current?.(code);
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;
    setErrorCode(null);

    const windowWithSpeech = window as unknown as WindowWithSpeech;
    const SpeechConstructor =
      windowWithSpeech.SpeechRecognition ??
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      reportError("unsupported");
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    // Explicitly request microphone stream to trigger browser's permission prompt
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        activeStreamRef.current = stream;
      } catch {
        reportError("not-allowed");
        setIsListening(false);
        shouldListenRef.current = false;
        return;
      }
    }

    shouldListenRef.current = true;

    try {
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorCode(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentFull = "";
        for (const item of Array.from(event.results)) {
          if (item?.[0]?.transcript) {
            currentFull += `${item[0].transcript} `;
          }
        }
        const trimmed = currentFull.trim();
        if (trimmed) {
          setTranscript(trimmed);
          onTranscriptChangeRef.current?.(trimmed);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          shouldListenRef.current = false;
          setIsListening(false);
          reportError("not-allowed");
        } else if (event.error === "audio-capture") {
          shouldListenRef.current = false;
          setIsListening(false);
          reportError("audio-capture");
        } else if (event.error === "network") {
          shouldListenRef.current = false;
          setIsListening(false);
          reportError("network");
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          shouldListenRef.current = false;
          setIsListening(false);
          reportError("unknown");
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      reportError("unknown");
      setIsListening(false);
      shouldListenRef.current = false;
    }
  }, [lang, reportError]);

  const toggleListening = useCallback(() => {
    if (isListening || shouldListenRef.current) {
      stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    onTranscriptChangeRef.current?.("");
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    isSupported,
    errorCode,
    error: errorCode,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
