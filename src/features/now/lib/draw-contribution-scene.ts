import type { Point2 } from "./contribution-camera";
import { projectContributionScene } from "./contribution-camera";
import type { ContributionCamera } from "./contribution-camera";
import type { ContributionCell } from "./contribution-visuals";
export interface BlockPalette { top: string; side: string; front: string; stud: string; }
function fillPolygon(context: CanvasRenderingContext2D, points: Point2[], color: string) {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index++) context.lineTo(points[index][0], points[index][1]);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}
export function drawContributionScene(
  canvas: HTMLCanvasElement, cells: ContributionCell[], weeks: number,
  camera: ContributionCamera, palette: BlockPalette[],
) {
  const context = canvas.getContext("2d");
  if (!context) return [];
  context.setTransform(canvas.width / 1000, 0, 0, canvas.height / 600, 0, 0);
  context.clearRect(0, 0, 1000, 600);
  const scene = projectContributionScene(cells, weeks, camera);
  for (const block of scene) {
    const color = palette[block.day.level] ?? palette[0];
    if (!color) continue;
    fillPolygon(context, block.sideX, color.side);
    fillPolygon(context, block.sideY, color.front);
    fillPolygon(context, block.top, color.top);
    for (const stud of block.studs) {
      context.beginPath();
      context.ellipse(stud.base[0], stud.base[1], stud.radiusX, stud.radiusY, 0, 0, Math.PI * 2);
      context.fillStyle = color.side;
      context.fill();
      context.beginPath();
      context.ellipse(stud.top[0], stud.top[1], stud.radiusX, stud.radiusY, 0, 0, Math.PI * 2);
      context.fillStyle = color.stud;
      context.fill();
    }
  }
  return scene;
}
export function containsPoint(points: Point2[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj-xi) * (y-yi) / (yj-yi) + xi) inside = !inside;
  }
  return inside;
}
