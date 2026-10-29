import type { ContributionDay } from "./github-contributions";
import { contributionCells } from "./contribution-visuals";

export type BreakoutStatus = "ready" | "playing" | "paused" | "won" | "lost";
export interface BreakoutBrick {
  id: string; x: number; y: number; width: number; height: number;
  level: number; count: number; removed: boolean;
}
export interface BreakoutGame {
  width: number; height: number; paddleX: number; paddleWidth: number; paddleY: number;
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  bricks: BreakoutBrick[];
  status: BreakoutStatus; lives: number; score: number; cleared: number;
}
const SPEED = 90;
export function createBreakoutGame(weeks: ContributionDay[][]): BreakoutGame {
  const width = Math.max(120, weeks.length * 12 + 24);
  const paddleWidth = Math.max(64, width * 0.16);
  return {
    width, height: 300, paddleX: (width-paddleWidth)/2, paddleWidth, paddleY: 270,
    ball: { x: width/2, y: 263, vx: SPEED*0.6, vy: -SPEED*0.8, radius: 4 },
    bricks: contributionCells(weeks).filter((day) => day.count > 0).map((day) => ({
      id: day.date, x: 12+day.week*12, y: 18+day.weekday*16, width: 10, height: 12,
      level: day.level, count: day.count, removed: false,
    })),
    status: "ready", lives: 3, score: 0, cleared: 0,
  };
}
export function moveBreakoutPaddle(game: BreakoutGame, center: number) {
  game.paddleX = Math.max(0, Math.min(game.width-game.paddleWidth, center-game.paddleWidth/2));
  if (game.status === "ready") game.ball.x = game.paddleX + game.paddleWidth/2;
}
export function advanceBreakout(game: BreakoutGame, elapsed: number, direction: number) {
  if (game.status !== "playing") return;
  // Small fixed substeps avoid passing through thin bricks after a slow frame.
  const steps = Math.max(1, Math.ceil(Math.min(elapsed, 0.05) * 120));
  const dt = Math.min(elapsed, 0.05) / steps;
  for (let step = 0; step < steps && game.status === "playing"; step++) {
    if (direction) moveBreakoutPaddle(game, game.paddleX + game.paddleWidth/2 + direction*420*dt);
    const ball = game.ball;
    const previousX = ball.x;
    const previousY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); }
    if (ball.x > game.width-ball.radius) { ball.x = game.width-ball.radius; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < ball.radius) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy); }

    if (ball.vy > 0 && previousY + ball.radius <= game.paddleY &&
        ball.y + ball.radius >= game.paddleY && ball.x + ball.radius >= game.paddleX &&
        ball.x - ball.radius <= game.paddleX + game.paddleWidth) {
      const impact = Math.max(-1, Math.min(1, (ball.x-game.paddleX-game.paddleWidth/2)/(game.paddleWidth/2)));
      const angle = impact * Math.PI / 3;
      ball.y = game.paddleY-ball.radius;
      ball.vx = Math.sin(angle)*SPEED;
      ball.vy = -Math.cos(angle)*SPEED;
    }
    for (const brick of game.bricks) {
      if (brick.removed) continue;
      const closestX = Math.max(brick.x, Math.min(brick.x+brick.width, ball.x));
      const closestY = Math.max(brick.y, Math.min(brick.y+brick.height, ball.y));
      if ((ball.x-closestX)**2 + (ball.y-closestY)**2 > ball.radius**2) continue;
      brick.removed = true;
      game.cleared++;
      game.score += brick.count;
      if (previousX + ball.radius <= brick.x || previousX-ball.radius >= brick.x+brick.width) ball.vx *= -1;
      else ball.vy *= -1;
      if (game.cleared === game.bricks.length) game.status = "won";
      break;
    }
    if (ball.y-ball.radius > game.height) {
      game.lives--;
      if (game.lives === 0) game.status = "lost";
      else {
        game.status = "ready";
        game.ball = { x: game.paddleX+game.paddleWidth/2, y: game.paddleY-7,
          vx: SPEED*0.6, vy: -SPEED*0.8, radius: 4 };
      }
    }
  }
}
