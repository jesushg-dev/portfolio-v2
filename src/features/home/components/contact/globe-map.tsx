"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from "geojson";
import { useTranslations } from "next-intl";
import {
  Globe,
  Grid,
  Layers,
  Map as MapIcon,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type GeoFeature = Feature<Geometry, GeoJsonProperties>;

interface LocationPoint {
  lat: number;
  lon: number;
  label?: string;
}

type ConnectionPhase =
  "idle" | "focusOrigin" | "zoomingOut" | "revealDestination" | "line" | "done";

interface GlobeMapProps {
  /** Where the camera starts, zoomed in close (visitor's location). */
  origin: LocationPoint;
  /** Where the connecting line travels to (portfolio owner's location). */
  destination: LocationPoint;
  /** Auto-run the reveal sequence once world data has loaded. */
  autoPlayConnection?: boolean;
  /** Accent color for markers and the connecting line. Default uses theme primary token. */
  accentColor?: string;
  /** Fill color for the ocean / globe sphere. Default uses theme card token. */
  oceanColor?: string;
  /** Fill color for land / continents. Default uses theme muted token. */
  landColor?: string;
}

const DEFAULT_ACCENT_COLOR = "var(--primary)";
const DEFAULT_OCEAN_COLOR = "var(--card)";
const DEFAULT_LAND_COLOR = "var(--muted)";

const FOCUS_ORIGIN_HOLD_MS = 500;
const ZOOM_OUT_DURATION_MS = 1500;
const REVEAL_DESTINATION_HOLD_MS = 550;
const LINE_DRAW_DURATION_MS = 1600;
const ZOOM_IN_FACTOR = 4.5;
const GLOBE_MODE_THRESHOLD = 0.7;
const BOUNDARY_SEGMENTS = 144;
const FRAME_MARGIN_PX = 180;
const MIN_ZOOM_OUT = 1;
const MAX_ZOOM_OUT = 3.2;
const FLIGHT_EXTRA_LIFT_RATIO = 0.1;
const FLIGHT_EXTRA_LIFT_MAX_PX = 28;

export interface InterpolatedProjection extends d3.GeoProjection {
  alpha(): number;
  alpha(t: number): InterpolatedProjection;
}

function interpolateProjection(
  raw0: d3.GeoRawProjection,
  raw1: d3.GeoRawProjection,
): InterpolatedProjection {
  const mutate = d3.geoProjectionMutator(
    (t: number) => (x: number, y: number) => {
      const [x0, y0] = raw0(x, y);
      const [x1, y1] = raw1(x, y);
      return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
    },
  );

  let currentAlpha = 0;
  const proj = (mutate as (t: number) => d3.GeoProjection)(
    currentAlpha,
  ) as InterpolatedProjection;

  proj.alpha = function (_?: number): number | InterpolatedProjection {
    if (typeof _ === "number") {
      currentAlpha = _;
      (mutate as (t: number) => d3.GeoProjection)(currentAlpha);
      return proj;
    }
    return currentAlpha;
  } as InterpolatedProjection["alpha"];

  return proj;
}

function getGlobeBoundaryPath(
  projectionFn: (point: [number, number]) => [number, number] | null,
  centerLon: number,
  centerLat: number,
  centerX: number,
  centerY: number,
  scaleValue: number,
  alpha: number,
): string {
  const lat0 = (centerLat * Math.PI) / 180;
  const lon0 = (centerLon * Math.PI) / 180;
  const rectHalfW = scaleValue * Math.PI;
  const rectHalfH = (scaleValue * Math.PI) / 2;

  let d = "";
  for (let i = 0; i < BOUNDARY_SEGMENTS; i++) {
    const bearing = (i / BOUNDARY_SEGMENTS) * Math.PI * 2;
    const cosB = Math.cos(bearing);
    const sinB = Math.sin(bearing);

    const lat = Math.asin(Math.cos(lat0) * cosB);
    const lon =
      lon0 + Math.atan2(sinB * Math.cos(lat0), -Math.sin(lat0) * Math.sin(lat));
    const projected = projectionFn([
      (lon * 180) / Math.PI,
      (lat * 180) / Math.PI,
    ]);

    const denom = Math.max(Math.abs(cosB), Math.abs(sinB)) || 1;
    const rectX = centerX + (cosB / denom) * rectHalfW;
    const rectY = centerY + (sinB / denom) * rectHalfH;

    let x: number;
    let y: number;
    if (
      projected &&
      !Number.isNaN(projected[0]) &&
      !Number.isNaN(projected[1])
    ) {
      x = projected[0] + (rectX - projected[0]) * alpha;
      y = projected[1] + (rectY - projected[1]) * alpha;
    } else {
      x = rectX;
      y = rectY;
    }

    d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
  }
  return `${d}Z`;
}

function getFollowRotation(
  origin: LocationPoint,
  destination: LocationPoint,
): [number, number] {
  const interpolate = d3.geoInterpolate(
    [origin.lon, origin.lat],
    [destination.lon, destination.lat],
  );
  const [midLon, midLat] = interpolate(0.5);
  return [-midLon, -midLat];
}

function isValidProjected(
  point: [number, number] | null,
): point is [number, number] {
  return (
    point != null &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    !Number.isNaN(point[0]) &&
    !Number.isNaN(point[1])
  );
}

function quadraticThrough(
  start: [number, number],
  through: [number, number],
  end: [number, number],
): [number, number] {
  return [
    2 * through[0] - (start[0] + end[0]) / 2,
    2 * through[1] - (start[1] + end[1]) / 2,
  ];
}

function quadraticSegment(
  start: [number, number],
  control: [number, number],
  end: [number, number],
  t: number,
): string {
  const progress = Math.min(Math.max(t, 0), 1);
  if (progress <= 0) return "";

  const rest = 1 - progress;
  const controlPrime: [number, number] = [
    rest * start[0] + progress * control[0],
    rest * start[1] + progress * control[1],
  ];
  const tip: [number, number] = [
    rest * rest * start[0] +
      2 * rest * progress * control[0] +
      progress * progress * end[0],
    rest * rest * start[1] +
      2 * rest * progress * control[1] +
      progress * progress * end[1],
  ];

  return `M${start[0]},${start[1]} Q${controlPrime[0]},${controlPrime[1]} ${tip[0]},${tip[1]}`;
}

function flightPathD(
  origin: LocationPoint,
  destination: LocationPoint,
  project: (point: [number, number]) => [number, number] | null,
  lineProgress: number,
  globeFactor: number,
  isVisible: (lon: number, lat: number) => boolean,
): string {
  const start = project([origin.lon, origin.lat]);
  const end = project([destination.lon, destination.lat]);
  if (!isValidProjected(start) || !isValidProjected(end)) return "";

  const interpolate = d3.geoInterpolate(
    [origin.lon, origin.lat],
    [destination.lon, destination.lat],
  );
  const [midLon, midLat] = interpolate(0.5);
  const geoMid = isVisible(midLon, midLat) ? project([midLon, midLat]) : null;

  const chordMid: [number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ];
  const through: [number, number] = isValidProjected(geoMid)
    ? [
        chordMid[0] + (geoMid[0] - chordMid[0]) * globeFactor,
        chordMid[1] + (geoMid[1] - chordMid[1]) * globeFactor,
      ]
    : chordMid;

  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const chord = Math.hypot(dx, dy) || 1;
  const geoLiftX = through[0] - chordMid[0];
  const geoLiftY = through[1] - chordMid[1];
  const geoLift = Math.hypot(geoLiftX, geoLiftY);

  let liftX: number;
  let liftY: number;
  if (geoLift > 2) {
    liftX = geoLiftX / geoLift;
    liftY = geoLiftY / geoLift;
  } else {
    liftX = -dy / chord;
    liftY = dx / chord;
    if (liftY > 0) {
      liftX = -liftX;
      liftY = -liftY;
    }
  }

  const extra =
    Math.min(chord * FLIGHT_EXTRA_LIFT_RATIO, FLIGHT_EXTRA_LIFT_MAX_PX) *
    globeFactor;
  const peaked: [number, number] = [
    through[0] + liftX * extra,
    through[1] + liftY * extra,
  ];
  const control = quadraticThrough(start, peaked, end);

  return quadraticSegment(start, control, end, lineProgress);
}

function getZoomOutTarget(
  origin: LocationPoint,
  destination: LocationPoint,
): number {
  const angularDistance = d3.geoDistance(
    [origin.lon, origin.lat],
    [destination.lon, destination.lat],
  );

  // For very close locations (e.g. Managua <-> Tegucigalpa),
  // scale zoom up substantially so neighboring regions fill the frame cleanly.
  const safeAngle = Math.max(
    Math.min(angularDistance, Math.PI / 2 - 0.05),
    0.005,
  );

  const idealZoom = (FRAME_MARGIN_PX * 2.6) / (200 * Math.sin(safeAngle / 2));
  return Math.min(Math.max(idealZoom, MIN_ZOOM_OUT), MAX_ZOOM_OUT);
}

export function GlobeMap({
  origin,
  destination,
  autoPlayConnection = true,
  accentColor = DEFAULT_ACCENT_COLOR,
  oceanColor = DEFAULT_OCEAN_COLOR,
  landColor = DEFAULT_LAND_COLOR,
}: GlobeMapProps) {
  const t = useTranslations("main.contact.globe");
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [worldData, setWorldData] = useState<GeoFeature[]>([]);
  const [rotation, setRotation] = useState([0, 0]);
  const [userZoomMultiplier, setUserZoomMultiplier] = useState(1);
  const [translation] = useState([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState([0, 0]);

  const [connectionPhase, setConnectionPhase] =
    useState<ConnectionPhase>("idle");
  const [cameraZoom, setCameraZoom] = useState(1);
  const [lineProgress, setLineProgress] = useState(0);
  const [showGraticule, setShowGraticule] = useState(true);
  const [showOceanFill, setShowOceanFill] = useState(true);
  const hasPoppedOrigin = useRef(false);
  const hasPoppedDestination = useRef(false);
  const hasAutoPlayedRef = useRef(false);
  const sequenceTimers = useRef<number[]>([]);

  const width = 800;
  const height = 500;

  const fallbackLabel = t("yourLocation");

  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
        );
        const world = (await response.json()) as Topology<{
          countries: GeometryCollection;
        }>;
        const collection = feature(
          world,
          world.objects.countries,
        ) as FeatureCollection<Geometry, GeoJsonProperties>;
        setWorldData(collection.features);
      } catch {
        setWorldData([
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-180, -90],
                  [180, -90],
                  [180, 90],
                  [-180, 90],
                  [-180, -90],
                ],
              ],
            },
            properties: {},
          },
        ]);
      }
    };

    void loadWorldData();
  }, []);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setLastMouse([event.clientX - rect.left, event.clientY - rect.top]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentMouse = [event.clientX - rect.left, event.clientY - rect.top];
    const dx = currentMouse[0] - lastMouse[0];
    const dy = currentMouse[1] - lastMouse[1];

    const tProg = progress[0] / 100;
    const sensitivity = tProg < 0.5 ? 0.5 : 0.25;

    setRotation((prev) => [
      prev[0] + dx * sensitivity,
      Math.max(-90, Math.min(90, prev[1] - dy * sensitivity)),
    ]);
    setLastMouse(currentMouse);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    setUserZoomMultiplier((prev) =>
      Math.min(Math.max(prev * zoomFactor, 0.4), 18),
    );
  };

  const handleZoomIn = () => {
    setUserZoomMultiplier((prev) => Math.min(prev * 1.25, 18));
  };

  const handleZoomOut = () => {
    setUserZoomMultiplier((prev) => Math.max(prev * 0.8, 0.4));
  };

  const clearSequenceTimers = () => {
    sequenceTimers.current.forEach((id) => window.clearTimeout(id));
    sequenceTimers.current = [];
  };

  const playConnectionSequence = () => {
    clearSequenceTimers();
    hasPoppedOrigin.current = false;
    hasPoppedDestination.current = false;
    setLineProgress(0);
    setUserZoomMultiplier(1);
    setCameraZoom(ZOOM_IN_FACTOR);
    setConnectionPhase("focusOrigin");

    sequenceTimers.current.push(
      window.setTimeout(
        () => setConnectionPhase("zoomingOut"),
        FOCUS_ORIGIN_HOLD_MS,
      ),
    );
  };

  const handleReset = () => {
    setRotation([0, 0]);
    setUserZoomMultiplier(1);
  };

  useEffect(() => clearSequenceTimers, []);

  useEffect(() => {
    if (
      !autoPlayConnection ||
      worldData.length === 0 ||
      hasAutoPlayedRef.current
    )
      return;
    hasAutoPlayedRef.current = true;
    playConnectionSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayConnection, worldData]);

  useEffect(() => {
    if (connectionPhase !== "zoomingOut") return;

    let raf = 0;
    const startTime = Date.now();
    const startZoom = ZOOM_IN_FACTOR;
    const endZoom = getZoomOutTarget(origin, destination);

    const step = () => {
      const elapsed = Date.now() - startTime;
      const tProg = Math.min(elapsed / ZOOM_OUT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - tProg, 3);
      setCameraZoom(startZoom + (endZoom - startZoom) * eased);

      if (tProg < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setCameraZoom(endZoom);
        setConnectionPhase("revealDestination");
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [connectionPhase, origin, destination]);

  useEffect(() => {
    if (connectionPhase !== "revealDestination") return;
    const id = window.setTimeout(
      () => setConnectionPhase("line"),
      REVEAL_DESTINATION_HOLD_MS,
    );
    sequenceTimers.current.push(id);
    return () => window.clearTimeout(id);
  }, [connectionPhase]);

  useEffect(() => {
    if (connectionPhase !== "line") return;

    let raf = 0;
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const tProg = Math.min(elapsed / LINE_DRAW_DURATION_MS, 1);
      const eased =
        tProg < 0.5 ? 2 * tProg * tProg : -1 + (4 - 2 * tProg) * tProg;
      setLineProgress(eased);

      if (tProg < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setRotation(getFollowRotation(origin, destination));
        setConnectionPhase("done");
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [connectionPhase, origin, destination]);

  useEffect(() => {
    if (!svgRef.current || worldData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tProg = progress[0] / 100;
    const alpha = Math.pow(tProg, 0.5);

    const scale = d3.scaleLinear().domain([0, 1]).range([200, 120]);
    const baseRotate = d3.scaleLinear().domain([0, 1]).range([0, 0]);

    const isSequenceActive =
      connectionPhase !== "idle" && connectionPhase !== "done";
    const originRotation: [number, number] = [-origin.lon, -origin.lat];
    const followRotation = getFollowRotation(origin, destination);
    const zoomOutTarget = getZoomOutTarget(origin, destination);
    const panT = Math.min(
      Math.max(
        (ZOOM_IN_FACTOR - cameraZoom) / (ZOOM_IN_FACTOR - zoomOutTarget),
        0,
      ),
      1,
    );
    const effectiveRotation: [number, number] = isSequenceActive
      ? [
          originRotation[0] + (followRotation[0] - originRotation[0]) * panT,
          originRotation[1] + (followRotation[1] - originRotation[1]) * panT,
        ]
      : [rotation[0], rotation[1]];

    const effectiveScale = scale(alpha) * cameraZoom * userZoomMultiplier;

    const projection = interpolateProjection(
      d3.geoOrthographicRaw,
      d3.geoEquirectangularRaw,
    )
      .scale(effectiveScale)
      .translate([width / 2 + translation[0], height / 2 + translation[1]])
      .rotate([baseRotate(alpha) + effectiveRotation[0], effectiveRotation[1]])
      .precision(0.1);

    projection.alpha(alpha);

    const path = d3.geoPath(projection);

    const currentRotate = projection.rotate();
    const cullBackHemisphere = tProg < GLOBE_MODE_THRESHOLD;

    const isFrontFacing = (lon: number, lat: number) => {
      if (!cullBackHemisphere) return true;
      const antipode: [number, number] = [-currentRotate[0], -currentRotate[1]];
      return d3.geoDistance([lon, lat], antipode) < Math.PI / 2 + 0.05;
    };

    const boundaryCenterX = width / 2 + translation[0];
    const boundaryCenterY = height / 2 + translation[1];
    const globeBoundaryD = getGlobeBoundaryPath(
      projection,
      -currentRotate[0],
      -currentRotate[1],
      boundaryCenterX,
      boundaryCenterY,
      effectiveScale,
      alpha,
    );

    if (showOceanFill) {
      svg
        .append("path")
        .attr("d", globeBoundaryD)
        .attr("fill", oceanColor)
        .attr("stroke", "none");
    }

    if (showGraticule) {
      try {
        const graticule = d3.geoGraticule();
        const graticulePath = path(graticule());
        if (graticulePath) {
          svg
            .append("path")
            .datum(graticule())
            .attr("d", graticulePath)
            .attr("fill", "none")
            .attr("stroke", "var(--border)")
            .attr("stroke-width", 1)
            .attr("opacity", 0.35);
        }
      } catch {
        // silent
      }
    }

    svg
      .selectAll(".country")
      .data(worldData)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", (d) => {
        try {
          const pathString = path(d);
          if (!pathString) return "";
          if (
            typeof pathString === "string" &&
            (pathString.includes("NaN") || pathString.includes("Infinity"))
          ) {
            return "";
          }
          return pathString;
        } catch {
          return "";
        }
      })
      .attr("fill", landColor)
      .attr("stroke", "var(--border)")
      .attr("stroke-width", 0.5)
      .attr("opacity", 1.0)
      .style("visibility", function (d) {
        const pathData = d3.select(this).attr("d");
        const hasValidPath =
          pathData && pathData.length > 0 && !pathData.includes("NaN");
        if (!hasValidPath) return "hidden";
        if (!cullBackHemisphere) return "visible";
        try {
          const centroid = d3.geoCentroid(d);
          return isFrontFacing(centroid[0], centroid[1]) ? "visible" : "hidden";
        } catch {
          return "visible";
        }
      });

    svg
      .append("path")
      .attr("d", globeBoundaryD)
      .attr("fill", "none")
      .attr("stroke", "var(--border)")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8);

    const coordOrigin = projection([origin.lon, origin.lat]);
    const coordDestination = projection([destination.lon, destination.lat]);

    const distinctOrigin =
      origin.lat !== destination.lat || origin.lon !== destination.lon;
    const showOrigin =
      distinctOrigin &&
      connectionPhase !== "idle" &&
      !!coordOrigin &&
      isFrontFacing(origin.lon, origin.lat);
    const showDestination =
      (connectionPhase === "revealDestination" ||
        connectionPhase === "line" ||
        connectionPhase === "done" ||
        !distinctOrigin) &&
      !!coordDestination &&
      isFrontFacing(destination.lon, destination.lat);
    const showLine =
      distinctOrigin &&
      (connectionPhase === "line" || connectionPhase === "done") &&
      !!coordOrigin &&
      !!coordDestination &&
      isFrontFacing(origin.lon, origin.lat) &&
      isFrontFacing(destination.lon, destination.lat);

    const drawHalo = (
      group: d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>,
      x: number,
      y: number,
    ) => {
      group
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 9)
        .attr("fill", accentColor)
        .attr("opacity", 0.3)
        .attr("class", "animate-pulse");
    };

    const drawLabel = (
      group: d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>,
      x: number,
      y: number,
      text: string,
    ) => {
      if (!text) return;
      group
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--foreground)")
        .attr("stroke", "var(--background)")
        .attr("stroke-width", 4)
        .attr("paint-order", "stroke")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text(text);
    };

    const drawDotMarker = (
      coord: [number, number],
      label: string,
      hasPopped: React.MutableRefObject<boolean>,
    ) => {
      const group = svg.append("g").attr("class", "location-marker");
      drawHalo(group, coord[0], coord[1]);

      const circle = group
        .append("circle")
        .attr("cx", coord[0])
        .attr("cy", coord[1])
        .attr("fill", accentColor)
        .attr("stroke", "var(--background)")
        .attr("stroke-width", 2);

      if (!hasPopped.current) {
        circle
          .attr("r", 0)
          .attr("opacity", 0)
          .transition()
          .duration(380)
          .ease(d3.easeBackOut)
          .attr("r", 6)
          .attr("opacity", 1);
        hasPopped.current = true;
      } else {
        circle.attr("r", 6).attr("opacity", 1);
      }

      drawLabel(group, coord[0], coord[1] - 16, label);
    };

    const drawPinMarker = (
      coord: [number, number],
      label: string,
      hasPopped: React.MutableRefObject<boolean>,
    ) => {
      const group = svg.append("g").attr("class", "location-marker");
      drawHalo(group, coord[0], coord[1]);

      const pin = group
        .append("g")
        .attr("transform", `translate(${coord[0]},${coord[1]})`);

      const path = pin
        .append("path")
        .attr(
          "d",
          "M0,0 C-1,-10 -9,-16 -9,-24 A9,9 0 1,1 9,-24 C9,-16 1,-10 0,0 Z",
        )
        .attr("fill", accentColor)
        .attr("stroke", "var(--background)")
        .attr("stroke-width", 1.5);

      pin
        .append("circle")
        .attr("cx", 0)
        .attr("cy", -24)
        .attr("r", 3.5)
        .attr("fill", "var(--background)");

      if (!hasPopped.current) {
        path.attr("opacity", 0).transition().duration(380).attr("opacity", 1);
        hasPopped.current = true;
      }

      drawLabel(group, coord[0], coord[1] - 38, label);
    };

    if (showOrigin && coordOrigin) {
      drawPinMarker(coordOrigin, origin.label ?? "", hasPoppedOrigin);
    }
    if (showDestination && coordDestination) {
      drawDotMarker(
        coordDestination,
        destination.label ?? "",
        hasPoppedDestination,
      );
    }

    if (showLine && coordOrigin && coordDestination) {
      const flightPath = flightPathD(
        origin,
        destination,
        projection,
        lineProgress,
        1 - tProg,
        isFrontFacing,
      );

      if (flightPath) {
        svg
          .insert("path", ".location-marker")
          .attr("d", flightPath)
          .attr("fill", "none")
          .attr("stroke", accentColor)
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("stroke-dasharray", "6,5");

        if (connectionPhase === "done") {
          let defs = svg.select<SVGDefsElement>("defs");
          if (defs.empty()) {
            defs = svg.append("defs");
          }
          if (defs.select("#packet-glow").empty()) {
            const filter = defs
              .append("filter")
              .attr("id", "packet-glow")
              .attr("x", "-50%")
              .attr("y", "-50%")
              .attr("width", "200%")
              .attr("height", "200%");
            filter
              .append("feGaussianBlur")
              .attr("stdDeviation", "2.5")
              .attr("result", "coloredBlur");
            const merge = filter.append("feMerge");
            merge.append("feMergeNode").attr("in", "coloredBlur");
            merge.append("feMergeNode").attr("in", "SourceGraphic");
          }

          const packetGroup = svg
            .insert("g", ".location-marker")
            .attr("class", "packet-transmission");

          // Ping ripple at destination (Managua) upon request packet arrival
          const destRipple = packetGroup
            .append("circle")
            .attr("cx", coordDestination[0])
            .attr("cy", coordDestination[1])
            .attr("fill", "none")
            .attr("stroke", accentColor)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0);

          destRipple
            .append("animate")
            .attr("attributeName", "r")
            .attr("values", "4;4;24;26;4")
            .attr("keyTimes", "0;0.38;0.52;0.56;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          destRipple
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;0;0.85;0;0")
            .attr("keyTimes", "0;0.38;0.41;0.54;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          // Ping ripple at origin (Visitor) upon return packet arrival
          const originRipple = packetGroup
            .append("circle")
            .attr("cx", coordOrigin[0])
            .attr("cy", coordOrigin[1])
            .attr("fill", "none")
            .attr("stroke", accentColor)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0);

          originRipple
            .append("animate")
            .attr("attributeName", "r")
            .attr("values", "4;4;24;26;4")
            .attr("keyTimes", "0;0.86;0.97;0.99;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          originRipple
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;0;0.85;0;0")
            .attr("keyTimes", "0;0.86;0.89;0.98;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          // Forward Trail Particle (faint trail behind forward packet)
          const fwdTrail = packetGroup.append("g");
          fwdTrail
            .append("circle")
            .attr("r", 2.2)
            .attr("fill", accentColor)
            .attr("opacity", 0.5)
            .attr("filter", "url(#packet-glow)");

          fwdTrail
            .append("animateMotion")
            .attr("path", flightPath)
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite")
            .attr("keyPoints", "0;0.97;0.97;0.97;0")
            .attr("keyTimes", "0;0.41;0.41;0.98;1")
            .attr("calcMode", "linear");

          fwdTrail
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;0.6;0.6;0;0;0")
            .attr("keyTimes", "0;0.05;0.37;0.41;0.98;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          // Forward Main Packet (Origin -> Destination)
          const fwdPacket = packetGroup.append("g");
          fwdPacket
            .append("circle")
            .attr("r", 5)
            .attr("fill", accentColor)
            .attr("opacity", 0.45)
            .attr("filter", "url(#packet-glow)");

          fwdPacket
            .append("circle")
            .attr("r", 2.8)
            .attr("fill", "#ffffff")
            .attr("stroke", accentColor)
            .attr("stroke-width", 1.2);

          fwdPacket
            .append("animateMotion")
            .attr("path", flightPath)
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite")
            .attr("keyPoints", "0;1;1;1;0")
            .attr("keyTimes", "0;0.40;0.40;0.98;1")
            .attr("calcMode", "linear");

          fwdPacket
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;1;1;0;0;0")
            .attr("keyTimes", "0;0.04;0.36;0.40;0.98;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          // Return Trail Particle (faint trail behind return packet)
          const retTrail = packetGroup.append("g");
          retTrail
            .append("circle")
            .attr("r", 2.2)
            .attr("fill", accentColor)
            .attr("opacity", 0.5)
            .attr("filter", "url(#packet-glow)");

          retTrail
            .append("animateMotion")
            .attr("path", flightPath)
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite")
            .attr("keyPoints", "1;1;0.03;0.03;1")
            .attr("keyTimes", "0;0.49;0.89;0.98;1")
            .attr("calcMode", "linear");

          retTrail
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;0;0.6;0.6;0;0")
            .attr("keyTimes", "0;0.49;0.53;0.85;0.89;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");

          // Return Main Packet (Destination -> Origin)
          const retPacket = packetGroup.append("g");
          retPacket
            .append("circle")
            .attr("r", 5)
            .attr("fill", accentColor)
            .attr("opacity", 0.45)
            .attr("filter", "url(#packet-glow)");

          retPacket
            .append("circle")
            .attr("r", 2.8)
            .attr("fill", "#ffffff")
            .attr("stroke", accentColor)
            .attr("stroke-width", 1.2);

          retPacket
            .append("animateMotion")
            .attr("path", flightPath)
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite")
            .attr("keyPoints", "1;1;0;0;1")
            .attr("keyTimes", "0;0.48;0.88;0.98;1")
            .attr("calcMode", "linear");

          retPacket
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0;0;1;1;0;0")
            .attr("keyTimes", "0;0.48;0.52;0.84;0.88;1")
            .attr("dur", "4.5s")
            .attr("repeatCount", "indefinite");
        }
      }
    }
  }, [
    worldData,
    progress,
    rotation,
    userZoomMultiplier,
    translation,
    connectionPhase,
    cameraZoom,
    lineProgress,
    origin,
    destination,
    accentColor,
    oceanColor,
    landColor,
    showGraticule,
    showOceanFill,
    fallbackLabel,
    t,
  ]);

  const handleAnimate = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const startProgress = progress[0];
    const endProgress = startProgress === 0 ? 100 : 0;
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const tProg = Math.min(elapsed / duration, 1);
      const eased =
        tProg < 0.5 ? 2 * tProg * tProg : -1 + (4 - 2 * tProg) * tProg;
      setProgress([startProgress + (endProgress - startProgress) * eased]);

      if (tProg < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animate();
  };

  return (
    <div className="border-border/50 bg-card/40 relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border backdrop-blur-xs">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
        aria-label={t("ariaLabel", {
          origin: origin.label ?? fallbackLabel,
          destination: destination.label ?? "Managua",
        })}
        role="img"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating map controls toolbar */}
      <div className="bg-card/90 border-border/60 absolute right-2 bottom-2 z-10 flex items-center gap-1 rounded-lg border p-1 shadow-md backdrop-blur-md">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon-xs"
          title={t("zoomIn")}
          aria-label={t("zoomIn")}
          className="text-foreground hover:bg-accent"
        >
          <Plus className="size-3.5" />
        </Button>

        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon-xs"
          title={t("zoomOut")}
          aria-label={t("zoomOut")}
          className="text-foreground hover:bg-accent"
        >
          <Minus className="size-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                title={t("options")}
                aria-label={t("options")}
                className="text-foreground hover:bg-accent"
              >
                <Settings className="size-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={playConnectionSequence}
              className="cursor-pointer"
            >
              <RefreshCw className="text-muted-foreground mr-2 size-3.5" />
              <span>{t("replay")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleAnimate}
              disabled={isAnimating}
              className="cursor-pointer"
            >
              {progress[0] === 0 ? (
                <>
                  <MapIcon className="text-muted-foreground mr-2 size-3.5" />
                  <span>{t("unroll")}</span>
                </>
              ) : (
                <>
                  <Globe className="text-muted-foreground mr-2 size-3.5" />
                  <span>{t("roll")}</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleReset} className="cursor-pointer">
              <RotateCcw className="text-muted-foreground mr-2 size-3.5" />
              <span>{t("reset")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={showGraticule}
              onCheckedChange={(checked) => setShowGraticule(Boolean(checked))}
              className="cursor-pointer"
            >
              <Grid className="text-muted-foreground mr-2 size-3.5" />
              <span>{t("showGrid")}</span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={showOceanFill}
              onCheckedChange={(checked) => setShowOceanFill(Boolean(checked))}
              className="cursor-pointer"
            >
              <Layers className="text-muted-foreground mr-2 size-3.5" />
              <span>{t("showOcean")}</span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
