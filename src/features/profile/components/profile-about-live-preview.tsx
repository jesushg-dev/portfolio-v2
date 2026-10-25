"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ProfileLocaleTranslation,
  type ProfileStepState,
  hasText,
} from "../lib/profile-unified-types";

interface ProfileAboutLivePreviewProps {
  username: string;
  typingSpeed: number;
  delayBetweenCommands: number;
  steps: ProfileStepState[];
  currentTranslation: ProfileLocaleTranslation | null;
  baseTranslation: ProfileLocaleTranslation | null;
  t: {
    aboutTitle: string;
    noAboutText: string;
    play: string;
    playing: string;
    reset: string;
  };
}

interface TerminalPlaybackRow {
  command: string;
  output: string;
}

export const ProfileAboutLivePreview: FC<ProfileAboutLivePreviewProps> = ({
  username,
  typingSpeed,
  delayBetweenCommands,
  steps,
  currentTranslation,
  baseTranslation,
  t,
}) => {
  const tr = currentTranslation ?? baseTranslation;
  const aboutText =
    (tr && hasText(tr.about) ? tr.about : null) ??
    (baseTranslation && hasText(baseTranslation.about)
      ? baseTranslation.about
      : "") ??
    "";

  // Parse paragraphs and bold markdown **text**
  const paragraphs = useMemo(() => {
    if (!aboutText.trim()) return [];
    return aboutText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [aboutText]);

  const outputs = useMemo(() => {
    return tr?.outs ?? baseTranslation?.outs ?? [];
  }, [tr?.outs, baseTranslation?.outs]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRows, setPlaybackRows] = useState<TerminalPlaybackRow[]>([]);
  const [currentTypingCmd, setCurrentTypingCmd] = useState<string>("");
  const activeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  const cleanupTimers = useCallback(() => {
    if (activeTimerRef.current) {
      clearTimeout(activeTimerRef.current);
      activeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  const startPlayback = useCallback(() => {
    if (isPlayingRef.current) return;
    cleanupTimers();

    isPlayingRef.current = true;
    setIsPlaying(true);
    setPlaybackRows([]);
    setCurrentTypingCmd("");

    const speed = Math.max(1, typingSpeed || 45);
    const delay = Math.max(0, delayBetweenCommands || 0);

    let stepIndex = 0;

    function playNextStep() {
      if (!isPlayingRef.current) return;
      if (stepIndex >= steps.length) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setCurrentTypingCmd("");
        return;
      }

      const step = steps[stepIndex];
      const out = outputs[stepIndex] ?? "";
      const fullCmd = step?.cmd ?? "";
      let charIndex = 0;

      function typeCharacter() {
        if (!isPlayingRef.current) return;
        if (charIndex <= fullCmd.length) {
          setCurrentTypingCmd(fullCmd.slice(0, charIndex));
          charIndex++;
          activeTimerRef.current = setTimeout(typeCharacter, speed);
        } else {
          // Finished typing this command, push to rows
          setPlaybackRows((prev) => [
            ...prev,
            { command: fullCmd, output: out },
          ]);
          setCurrentTypingCmd("");
          stepIndex++;
          activeTimerRef.current = setTimeout(playNextStep, delay);
        }
      }

      typeCharacter();
    }

    playNextStep();
  }, [cleanupTimers, delayBetweenCommands, outputs, steps, typingSpeed]);

  const stopPlayback = useCallback(() => {
    cleanupTimers();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentTypingCmd("");
    setPlaybackRows([]);
  }, [cleanupTimers]);

  return (
    <div className="space-y-4">
      {/* About Paragraphs Preview */}
      <div className="border-border/80 bg-card rounded-2xl border p-4 shadow-xs">
        <h4 className="text-muted-foreground mb-2.5 text-xs font-semibold uppercase tracking-wider">
          {t.aboutTitle}
        </h4>
        {paragraphs.length > 0 ? (
          <div className="space-y-2">
            {paragraphs.map((para, i) => {
              // Parse **bold** markdown segments
              const segments = para.split(/(\*\*.*?\*\*)/g);
              return (
                <p
                  key={i}
                  className="text-foreground/90 text-xs leading-relaxed sm:text-sm"
                >
                  {segments.map((seg, segIdx) => {
                    if (seg.startsWith("**") && seg.endsWith("**")) {
                      return (
                        <strong
                          key={segIdx}
                          className="text-primary font-semibold"
                        >
                          {seg.slice(2, -2)}
                        </strong>
                      );
                    }
                    return seg;
                  })}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs italic">
            {t.noAboutText}
          </p>
        )}
      </div>

      {/* Terminal Preview Window */}
      <div className="border-border/80 bg-background/95 overflow-hidden rounded-xl border font-mono text-xs shadow-md">
        {/* Terminal Header */}
        <div className="border-border/80 bg-muted/40 flex items-center justify-between gap-2 border-b px-3.5 py-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80" />
            <span className="size-2.5 rounded-full bg-amber-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-muted-foreground ml-2 text-[0.6875rem]">
              {username || "Jesus-Macbook"}
            </span>
          </div>

          <div>
            {isPlaying ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={stopPlayback}
                className="h-6 gap-1 px-2 text-[0.6875rem]"
              >
                <RotateCcw className="size-3" aria-hidden />
                <span>{t.reset}</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startPlayback}
                disabled={steps.length === 0}
                className="h-6 gap-1 px-2 text-[0.6875rem]"
              >
                <Play className="size-3 text-primary fill-primary" aria-hidden />
                <span>{t.play}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Terminal Body */}
        <div className="space-y-3 p-3.5">
          {isPlaying ? (
            <>
              {playbackRows.map((row, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="text-muted-foreground">
                    <span className="text-primary font-semibold">
                      {username || "Jesus-Macbook"}
                    </span>{" "}
                    ~ % <span className="text-foreground">{row.command}</span>
                  </div>
                  {row.output && (
                    <pre className="text-muted-foreground/90 whitespace-pre-wrap font-sans text-xs">
                      {row.output}
                    </pre>
                  )}
                </div>
              ))}

              {currentTypingCmd && (
                <div className="text-muted-foreground">
                  <span className="text-primary font-semibold">
                    {username || "Jesus-Macbook"}
                  </span>{" "}
                  ~ %{" "}
                  <span className="text-foreground">{currentTypingCmd}</span>
                  <span className="bg-primary ml-0.5 inline-block h-3.5 w-1.5 animate-pulse" />
                </div>
              )}
            </>
          ) : (
            steps.map((step, idx) => {
              const out = outputs[idx] ?? "";
              return (
                <div key={step.id || idx} className="space-y-0.5">
                  <div className="text-muted-foreground">
                    <span className="text-primary font-semibold">
                      {username || "Jesus-Macbook"}
                    </span>{" "}
                    ~ %{" "}
                    <span className="text-foreground">
                      {step.cmd || "..."}
                    </span>
                  </div>
                  {out ? (
                    <pre className="text-muted-foreground/90 whitespace-pre-wrap font-sans text-xs">
                      {out}
                    </pre>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
