import type { ContributionCell } from "./contribution-visuals";

export interface ContributionCamera {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
}
export const initialContributionCamera: ContributionCamera = {
  yaw: 25,
  pitch: 35,
  zoom: 1,
  panX: 0,
  panY: 0,
};
type Point3 = [number, number, number];
export type Point2 = [number, number];

export function projectContributionScene(
  cells: ContributionCell[],
  weeks: number,
  camera: ContributionCamera,
) {
  const yaw = (camera.yaw * Math.PI) / 180;
  const pitch = (camera.pitch * Math.PI) / 180;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const pitchSin = Math.sin(pitch);
  const pitchCos = Math.cos(pitch);
  const raw = ([x, y, z]: Point3): Point2 => [
    x * cos - y * sin,
    (x * sin + y * cos) * pitchSin - z * pitchCos,
  ];
  const corners: Point3[] = [];
  for (const x of [-10, Math.max(0, weeks - 1) * 18 + 10]) {
    for (const y of [-10, 118]) {
      for (const z of [0, 42]) corners.push([x, y, z]);
    }
  }
  const bounds = corners.map(raw);
  const minX = Math.min(...bounds.map(([x]) => x));
  const maxX = Math.max(...bounds.map(([x]) => x));
  const minY = Math.min(...bounds.map(([, y]) => y));
  const maxY = Math.max(...bounds.map(([, y]) => y));
  const scale =
    Math.min(920 / Math.max(1, maxX - minX), 500 / Math.max(1, maxY - minY)) *
    camera.zoom;
  const project = (point: Point3): Point2 => {
    const [x, y] = raw(point);
    return [
      500 + (x - (minX + maxX) / 2) * scale + camera.panX,
      300 + (y - (minY + maxY) / 2) * scale + camera.panY,
    ];
  };
  const polygon = (points: Point3[]) =>
    points.map(project);
  return [...cells]
    .sort((a, b) => (a.week - b.week) * sin + (a.weekday - b.weekday) * cos)
    .map((day) => {
      const x = day.week * 18;
      const y = day.weekday * 18;
      const height = day.level ? 4 + day.level * 8 : 1;
      const xFace = sin >= 0 ? x + 8 : x - 8;
      const yFace = cos >= 0 ? y + 8 : y - 8;
      const studs =
        day.count > 0
          ? [-4, 4].flatMap((dx) =>
              [-4, 4].map((dy) => {
                return {
                  base: project([x + dx, y + dy, height]),
                  top: project([x + dx, y + dy, height + 2]),
                  radiusX: 2.5 * scale,
                  radiusY: 2.5 * scale * pitchSin,
                };
              }),
            )
          : [];
      return {
        day,
        sideX: polygon([
          [xFace, y - 8, 0],
          [xFace, y + 8, 0],
          [xFace, y + 8, height],
          [xFace, y - 8, height],
        ]),
        sideY: polygon([
          [x - 8, yFace, 0],
          [x + 8, yFace, 0],
          [x + 8, yFace, height],
          [x - 8, yFace, height],
        ]),
        top: polygon([
          [x - 8, y - 8, height],
          [x + 8, y - 8, height],
          [x + 8, y + 8, height],
          [x - 8, y + 8, height],
        ]),
        studs,
      };
    });
}
