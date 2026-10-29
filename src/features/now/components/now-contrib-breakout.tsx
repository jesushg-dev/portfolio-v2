"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockColors } from "../lib/contribution-visuals";
import {
  advanceBreakout,
  createBreakoutGame,
  moveBreakoutPaddle,
} from "../lib/contribution-breakout";
import type {
  BreakoutGame,
  BreakoutStatus,
} from "../lib/contribution-breakout";
import type { ReadyGitHubContributions } from "../lib/github-contributions";

interface GameView {
  status: BreakoutStatus;
  lives: number;
  score: number;
  removed: Set<string>;
}
function snapshot(game: BreakoutGame): GameView {
  return {
    status: game.status,
    lives: game.lives,
    score: game.score,
    removed: new Set(
      game.bricks.filter((brick) => brick.removed).map((brick) => brick.id),
    ),
  };
}
export default function NowContribBreakout({
  calendar,
}: {
  calendar: ReadyGitHubContributions;
}) {
  const t = useTranslations("main.now.activity");
  const reducedMotion = useReducedMotion();
  const instructions = useId();
  const initial = useMemo(
    () => createBreakoutGame(calendar.weeks),
    [calendar.weeks],
  );
  const game = useRef(initial);
  const [view, setView] = useState<GameView>(() => snapshot(initial));
  const board = useRef<HTMLDivElement>(null);
  const keys = useRef(new Set<string>());
  const ballX = useMotionValue(initial.ball.x);
  const ballY = useMotionValue(initial.ball.y);
  const paddleX = useMotionValue(initial.paddleX);
  const publishPosition = useCallback(() => {
    ballX.set(game.current.ball.x);
    ballY.set(game.current.ball.y);
    paddleX.set(game.current.paddleX);
  }, [ballX, ballY, paddleX]);
  const pause = useCallback(() => {
    keys.current.clear();
    if (game.current.status !== "playing") return;
    game.current.status = "paused";
    setView(snapshot(game.current));
  }, []);

  useEffect(() => {
    if (view.status !== "playing") return;
    let frame = 0;
    let previous = 0;
    const tick = (timestamp: number) => {
      const current = game.current;
      const dt = previous ? (timestamp - previous) / 1000 : 0;
      previous = timestamp;
      const before = current.cleared;
      const left = keys.current.has("ArrowLeft") || keys.current.has("a");
      const right = keys.current.has("ArrowRight") || keys.current.has("d");
      advanceBreakout(current, dt, Number(right) - Number(left));
      publishPosition();
      if (before !== current.cleared || current.status !== "playing")
        setView(snapshot(current));
      if (current.status === "playing") frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [view.status, publishPosition]);

  useEffect(() => {
    const element = board.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) pause();
    });
    observer.observe(element);
    const hidden = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", pause);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", pause);
    };
  }, [pause]);

  const toggle = () => {
    const current = game.current;
    if (
      !current.bricks.length ||
      current.status === "won" ||
      current.status === "lost"
    )
      return;
    if (current.status === "playing") pause();
    else {
      current.status = "playing";
      setView(snapshot(current));
      board.current?.focus({ preventScroll: true });
    }
  };
  const moveToPointer = (clientX: number) => {
    const rect = board.current?.getBoundingClientRect();
    if (!rect) return;
    moveBreakoutPaddle(
      game.current,
      ((clientX - rect.left) / Math.max(1, rect.width)) * game.current.width,
    );
    publishPosition();
  };
  const finished = view.status === "won" || view.status === "lost";
  return (
    <div
      className="min-w-0 space-y-4"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) pause();
      }}
    >
      <p
        id={instructions}
        className="text-muted-foreground mx-auto max-w-2xl text-center text-sm"
      >
        {t("gameInstructions")}
      </p>
      <div className="text-muted-foreground flex flex-wrap justify-center gap-5 text-sm tabular-nums">
        <span>{t("gameScore", { score: view.score })}</span>
        <span>{t("gameLives", { lives: view.lives })}</span>
        <span>
          {view.removed.size} / {initial.bricks.length}
        </span>
      </div>
      <div
        ref={board}
        tabIndex={0}
        role="region"
        aria-label={t("breakout")}
        aria-describedby={instructions}
        className="border-border focus-visible:ring-ring mx-auto w-full max-w-4xl touch-none overflow-hidden rounded-xl border outline-none focus-visible:ring-2"
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          if (
            ["ArrowLeft", "ArrowRight"].includes(event.key) ||
            key === "a" ||
            key === "d"
          ) {
            event.preventDefault();
            keys.current.add(event.key.startsWith("Arrow") ? event.key : key);
            if (game.current.status === "ready") {
              moveBreakoutPaddle(
                game.current,
                game.current.paddleX +
                  game.current.paddleWidth / 2 +
                  (event.key === "ArrowLeft" || key === "a" ? -18 : 18),
              );
              publishPosition();
            }
          } else if (event.code === "Space") {
            event.preventDefault();
            if (!event.repeat) toggle();
          } else if (event.key === "Escape") {
            event.preventDefault();
            pause();
          }
        }}
        onKeyUp={(event) => {
          keys.current.delete(event.key);
          keys.current.delete(event.key.toLowerCase());
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          moveToPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.isPrimary) moveToPointer(event.clientX);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={pause}
      >
        <svg
          viewBox={`0 0 ${initial.width} ${initial.height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={t("breakout")}
        >
          {initial.bricks.map((brick) => (
            <rect
              key={brick.id}
              x={brick.x}
              y={brick.y}
              width={brick.width}
              height={brick.height}
              rx={1.5}
              fill={blockColors[brick.level]}
              opacity={view.removed.has(brick.id) ? 0 : 1}
            >
              <title>
                {brick.id}: {brick.count}
              </title>
            </rect>
          ))}
          <motion.circle
            cx={ballX}
            cy={ballY}
            r={initial.ball.radius}
            fill="var(--foreground)"
          />
          <motion.rect
            x={paddleX}
            y={initial.paddleY}
            width={initial.paddleWidth}
            height={6}
            rx={3}
            fill="var(--primary)"
          />
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={finished || initial.bricks.length === 0}
          onClick={toggle}
        >
          {view.status === "playing" ? (
            <Pause aria-hidden />
          ) : (
            <Play aria-hidden />
          )}
          {view.status === "playing"
            ? t("gamePause")
            : view.status === "paused"
              ? t("gameResume")
              : t("gamePlay")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            game.current = createBreakoutGame(calendar.weeks);
            keys.current.clear();
            publishPosition();
            setView(snapshot(game.current));
          }}
        >
          <RotateCcw aria-hidden />
          {t("gameRestart")}
        </Button>
        {(["ArrowLeft", "ArrowRight"] as const).map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="icon"
            aria-label={key === "ArrowLeft" ? t("gameLeft") : t("gameRight")}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              keys.current.add(key);
            }}
            onPointerUp={(event) => {
              keys.current.delete(key);
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => keys.current.delete(key)}
            onLostPointerCapture={() => keys.current.delete(key)}
            onClick={() => {
              moveBreakoutPaddle(
                game.current,
                game.current.paddleX +
                  game.current.paddleWidth / 2 +
                  (key === "ArrowLeft" ? -24 : 24),
              );
              publishPosition();
            }}
          >
            {key === "ArrowLeft" ? (
              <ArrowLeft aria-hidden />
            ) : (
              <ArrowRight aria-hidden />
            )}
          </Button>
        ))}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="text-muted-foreground min-h-5 text-center text-sm"
      >
        {view.status === "won"
          ? t("gameWon")
          : view.status === "lost"
            ? t("gameLost")
            : view.status === "ready"
              ? t("gameReady")
              : view.status === "paused"
                ? t("gamePaused")
                : "\u00a0"}
      </p>
      {reducedMotion ? (
        <p className="text-muted-foreground text-center text-xs">
          {t("gameReduced")}
        </p>
      ) : null}
    </div>
  );
}
