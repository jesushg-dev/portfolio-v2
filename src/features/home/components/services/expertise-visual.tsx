"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { MediaImage } from "@/components/shared/media-image";
import type {
  ServiceVisualNode,
  ServiceVisualType,
} from "@/features/services/lib/service-visual";

interface DiagramProps {
  labels: string[];
}
interface ExpertiseVisualProps {
  image?: string;
  visualType: ServiceVisualType;
  nodes: ServiceVisualNode[];
  paused?: boolean;
}

function Text({
  x,
  y,
  children,
  anchor = "middle",
  tone = "normal",
}: {
  x: number;
  y: number;
  children?: ReactNode;
  anchor?: "middle" | "start" | "end";
  tone?: "normal" | "primary" | "success" | "danger";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={`font-mono text-[0.625rem] font-medium ${tone === "primary" ? "fill-primary" : tone === "success" ? "fill-success" : tone === "danger" ? "fill-destructive" : "fill-foreground/80"}`}
    >
      {children}
    </text>
  );
}
function Scene({
  start,
  end = 1,
  children,
}: {
  start: number;
  end?: number;
  children: ReactNode;
}) {
  const values =
    start === 0 ? "1;1;0;0" : end === 1 ? "0;0;1;1" : "0;0;1;1;0;0";
  const times =
    start === 0
      ? `0;${end - 0.01};${end};1`
      : end === 1
        ? `0;${start - 0.01};${start};1`
        : `0;${start - 0.01};${start};${end - 0.01};${end};1`;
  return (
    <g>
      <animate
        attributeName="opacity"
        values={values}
        keyTimes={times}
        dur="10s"
        repeatCount="indefinite"
      />
      {children}
    </g>
  );
}
function Packet({
  path,
  delay = 0,
  tone = "primary",
}: {
  path: string;
  delay?: number;
  tone?: "primary" | "success" | "danger";
}) {
  return (
    <circle
      r="3.5"
      className={
        tone === "success"
          ? "fill-success"
          : tone === "danger"
            ? "fill-destructive"
            : "fill-primary"
      }
    >
      <animateMotion
        path={path}
        dur="2s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}
function Badge({
  x,
  y,
  width = 100,
  label,
  success = false,
}: {
  x: number;
  y: number;
  width?: number;
  label?: string;
  success?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="24"
        rx="12"
        className={
          success
            ? "fill-success/10 stroke-success/25"
            : "fill-muted stroke-border"
        }
      />
      <Text x={x + width / 2} y={y + 16} tone={success ? "success" : "normal"}>
        {label}
      </Text>
    </g>
  );
}
function NetworkDiagram({ labels }: DiagramProps) {
  return (
    <>
      <rect
        x="6"
        y="96"
        width="62"
        height="56"
        rx="13"
        className="fill-muted stroke-border"
      />
      <Text x={37} y={128}>
        {labels[0]}
      </Text>
      {[64, 122, 180].map((y, i) => (
        <g key={y}>
          <path
            d={`M68 124C82 124 82 ${y} 98 ${y}M178 ${y}H205`}
            className="stroke-primary/35"
            fill="none"
            strokeDasharray="3 4"
          />
          <rect
            x="98"
            y={y - 19}
            width="80"
            height="38"
            rx="11"
            className="fill-muted stroke-border"
          />
          <circle cx="111" cy={y} r="3.5" className="fill-success" />
          <Text x={141} y={y + 4}>
            {labels[i + 1]}
          </Text>
          <Packet path={`M68 124C82 124 82 ${y} 98 ${y}`} delay={i * 0.4} />
        </g>
      ))}
      <rect
        x="205"
        y="38"
        width="37"
        height="164"
        rx="17"
        className="fill-primary/15 stroke-primary/25"
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x="214"
          y={58 + i * 44}
          width="19"
          height="26"
          rx="5"
          className="fill-primary/50"
        >
          <animate
            attributeName="opacity"
            values="1;.3;1"
            dur={`${2 + i * 0.4}s`}
            repeatCount="indefinite"
          />
        </rect>
      ))}
      <Text x={224} y={224}>
        {labels[4]}
      </Text>
      <path
        d="M242 122H295"
        className="stroke-primary/40"
        strokeDasharray="3 4"
      />
      <path
        d="M295 110v53a28 9 0 0 0 56 0v-53"
        className="fill-primary/15 stroke-primary/50"
      />
      <ellipse cx="323" cy="110" rx="28" ry="9" className="fill-primary/40" />
      <Text x={323} y={142}>
        {labels[5]}
      </Text>
      <Scene start={0} end={0.5}>
        <Packet path="M242 122H294" tone="danger" />
        <Badge x={258} y={182} width={103} label={labels[6]} />
      </Scene>
      <Scene start={0.5}>
        <Packet path="M242 122H294" tone="success" />
        <Badge x={256} y={182} width={107} label={labels[7]} success />
        <Text x={186} y={246} tone="success">
          {labels[8]}
        </Text>
      </Scene>
    </>
  );
}
function ArchitectureDiagram({ labels }: DiagramProps) {
  return (
    <g transform="translate(186 122)">
      <circle
        r="91"
        className="stroke-primary/30"
        fill="none"
        strokeDasharray="2 6"
      />
      <circle
        r="53"
        className="stroke-primary/25"
        fill="none"
        strokeDasharray="2 5"
      />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="30s"
          repeatCount="indefinite"
        />
        {[0, 90, 180, 270].map((angle, i) => (
          <g key={angle} transform={`rotate(${angle}) translate(91 0)`}>
            <circle r="18" className="fill-primary/75" />
            <g transform={`rotate(${-angle})`}>
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="-360"
                  dur="30s"
                  repeatCount="indefinite"
                />
                <text
                  textAnchor="middle"
                  y="3.5"
                  className="fill-primary-foreground font-mono text-[0.5625rem] font-semibold"
                >
                  {labels[i]}
                </text>
              </g>
            </g>
          </g>
        ))}
      </g>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="-360"
          dur="20s"
          repeatCount="indefinite"
        />
        {[0, 180].map((a) => (
          <circle
            key={a}
            cx={Math.cos((a * Math.PI) / 180) * 53}
            cy={Math.sin((a * Math.PI) / 180) * 53}
            r="8"
            className="fill-primary/50"
          />
        ))}
      </g>
      <rect
        x="-28"
        y="-28"
        width="56"
        height="56"
        rx="16"
        className="fill-primary"
      />
      <g
        className="stroke-primary-foreground"
        fill="none"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <path d="m0-12 14 7L0 2l-14-7zM-14 3 0 10l14-7M-14 11 0 18l14-7" />
      </g>
    </g>
  );
}
function FrontendDiagram({ labels }: DiagramProps) {
  return (
    <>
      <rect
        x="28"
        y="15"
        width="316"
        height="218"
        rx="16"
        className="fill-muted/60 stroke-border"
      />
      {[46, 60, 74].map((x) => (
        <circle key={x} cx={x} cy="31" r="3.5" className="fill-primary/50" />
      ))}
      <Text x={176} y={36}>
        {labels[0]}
      </Text>
      <Scene start={0} end={0.47}>
        <rect
          x="45"
          y="63"
          width="153"
          height="10"
          rx="5"
          className="fill-foreground/15"
        />
        <rect
          x="45"
          y="85"
          width="112"
          height="7"
          rx="3"
          className="fill-foreground/10"
        />
        <rect
          x="45"
          y="112"
          width="160"
          height="73"
          rx="9"
          className="fill-foreground/5"
        />
        <circle
          cx="126"
          cy="148"
          r="14"
          fill="none"
          className="stroke-primary/45"
          strokeWidth="3"
          strokeDasharray="32 88"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 126 148"
            to="360 126 148"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <path
          d="M95 31H320"
          className="stroke-destructive/60"
          strokeWidth="3"
          strokeDasharray="225"
          strokeDashoffset="225"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="225;30;0"
            dur="4.7s"
            repeatCount="indefinite"
          />
        </path>
        <Text x={274} y={148} tone="danger">
          {labels[1]}
        </Text>
      </Scene>
      <Scene start={0.47}>
        <rect
          x="45"
          y="60"
          width="153"
          height="12"
          rx="5"
          className="fill-primary/80"
        />
        <rect
          x="45"
          y="84"
          width="128"
          height="7"
          rx="3"
          className="fill-foreground/20"
        />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={45 + i * 55}
              y="108"
              width="48"
              height="66"
              rx="9"
              className="fill-primary/10 stroke-primary/20"
            />
            <rect
              x={51 + i * 55}
              y="115"
              width="36"
              height="29"
              rx="5"
              className="fill-primary/35"
            />
            <path
              d={`M${53 + i * 55} 155h24M${53 + i * 55} 162h17`}
              className="stroke-primary/50"
              strokeWidth="3"
            />
          </g>
        ))}
        <circle
          cx="278"
          cy="99"
          r="26"
          fill="none"
          className="stroke-success/25"
          strokeWidth="5"
        />
        <path
          d="m266 99 8 8 16-18"
          fill="none"
          className="stroke-success"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Text x={278} y={148} tone="success">
          {labels[2]}
        </Text>
        <rect
          x="45"
          y="192"
          width="92"
          height="23"
          rx="11"
          className="fill-primary"
        />
        <text
          x="91"
          y="207"
          textAnchor="middle"
          className="fill-primary-foreground font-mono text-[0.625rem]"
        >
          {labels[3]}
        </text>
        <circle
          cx="91"
          cy="204"
          r="0"
          fill="none"
          className="stroke-primary"
          strokeWidth="2"
        >
          <animate
            attributeName="r"
            values="0;0;25;25"
            keyTimes="0;.65;.8;1"
            dur="10s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0;1;0"
            keyTimes="0;.65;.66;1"
            dur="10s"
            repeatCount="indefinite"
          />
        </circle>
        <Badge x={150} y={192} width={86} label={labels[4]} />
        <Badge x={244} y={192} width={84} label={labels[5]} />
      </Scene>
      <Text x={186} y={249}>
        {labels[6]}
      </Text>
    </>
  );
}
function PipelineDiagram({ labels }: DiagramProps) {
  return (
    <>
      <path d="M38 63H334" className="stroke-primary/25" strokeWidth="3" />
      <path
        d="M38 63H334"
        className="stroke-primary"
        strokeWidth="3"
        strokeDasharray="296"
        strokeDashoffset="296"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="296;0;0"
          keyTimes="0;.7;1"
          dur="10s"
          repeatCount="indefinite"
        />
      </path>
      {[38, 137, 235, 334].map((x, i) => (
        <g key={x}>
          <circle
            cx={x}
            cy="63"
            r="21"
            className="fill-card stroke-primary/40"
          />
          <g>
            <animate
              attributeName="opacity"
              values=".1;.1;1;1"
              keyTimes={`0;${0.05 + i * 0.18};${0.12 + i * 0.18};1`}
              dur="10s"
              repeatCount="indefinite"
            />
            <path
              d={`m${x - 8} 63 6 6 11-12`}
              fill="none"
              className="stroke-success"
              strokeWidth="3"
            />
          </g>
          <Text x={x} y={104}>
            {labels[i]}
          </Text>
        </g>
      ))}
      <Badge x={18} y={127} width={102} label={labels[4]} />
      <Badge x={134} y={127} width={124} label={labels[5]} success />
      <Text x={20} y={183} anchor="start">
        {labels[6]}
      </Text>
      {Array.from({ length: 32 }, (_, i) => (
        <rect
          key={i}
          x={20 + i * 10.3}
          y={230 - (18 + ((i * 7) % 26))}
          width="6"
          height={18 + ((i * 7) % 26)}
          rx="3"
          className="fill-success/65"
        >
          <animate
            attributeName="opacity"
            values=".35;1;.35"
            dur="2.8s"
            begin={`${i * 0.15}s`}
            repeatCount="indefinite"
          />
        </rect>
      ))}
    </>
  );
}
function SecurityDiagram({ labels }: DiagramProps) {
  return (
    <>
      <rect
        x="150"
        y="12"
        width="214"
        height="125"
        rx="14"
        className="fill-muted/60 stroke-border"
      />
      <Text x={211} y={34}>
        {labels[0]}
      </Text>
      {[196, 249, 302].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="48"
            width="46"
            height="26"
            rx="7"
            className="fill-primary/15"
          />
          <rect
            x={x + 8}
            y="56"
            width="25"
            height="5"
            rx="2"
            className="fill-primary/50"
          />
        </g>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x={195 + i * 15}
          y={124 - (15 + ((i * 7) % 23))}
          width="9"
          height={15 + ((i * 7) % 23)}
          rx="3"
          className="fill-success/60"
        />
      ))}
      <Scene start={0} end={0.35}>
        <Badge x={248} y={18} width={106} label={labels[1]} />
      </Scene>
      <Scene start={0.35}>
        <Badge x={256} y={18} width={98} label={labels[2]} success />
      </Scene>
      <Scene start={0.55}>
        <rect
          x="7"
          y="23"
          width="105"
          height="85"
          rx="12"
          className="fill-destructive/10 stroke-destructive/25"
        />
        <Text x={60} y={47} tone="danger">
          {labels[3]}
        </Text>
        <path
          d="m23 60 8 7-8 7M40 75h26"
          className="stroke-destructive/70"
          fill="none"
          strokeWidth="2"
        />
        <Packet path="M112 65H142" tone="danger" />
        <path
          d="m138 56 10 17m-10 0 10-17"
          className="stroke-success"
          strokeWidth="3"
        />
        <Text x={75} y={127} tone="success">
          {labels[4]}
        </Text>
      </Scene>
      <rect
        x="7"
        y="154"
        width="357"
        height="89"
        rx="14"
        className="fill-muted/50 stroke-border"
      />
      <Text x={22} y={176} anchor="start">
        {labels[5]}
      </Text>
      <Scene start={0} end={0.35}>
        <Badge x={20} y={185} width={330} label={labels[6]} />
      </Scene>
      <Scene start={0.35} end={0.55}>
        <Badge x={20} y={185} width={330} label={labels[7]} success />
      </Scene>
      <Scene start={0.55}>
        <Badge x={20} y={185} width={330} label={labels[8]} success />
      </Scene>
      <Text x={186} y={232}>
        {labels[9]}
      </Text>
    </>
  );
}
function MobileDiagram({ labels }: DiagramProps) {
  return (
    <>
      <g transform="rotate(-8 62 140)">
        <rect
          x="13"
          y="43"
          width="98"
          height="188"
          rx="19"
          className="fill-muted stroke-border"
        />
        <Text x={62} y={70}>
          {labels[0]}
        </Text>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={27 + i * 15}
            y={152 - (18 + i * 12)}
            width="10"
            height={18 + i * 12}
            rx="3"
            className="fill-primary/60"
          >
            <animate
              attributeName="height"
              values={`${18 + i * 12};${48 - i * 5};${18 + i * 12}`}
              dur="3s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
        <path
          d="M29 176h64M29 189h45M29 202h55"
          className="stroke-primary/25"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(8 310 140)">
        <rect
          x="261"
          y="43"
          width="98"
          height="188"
          rx="19"
          className="fill-muted stroke-border"
        />
        <Text x={310} y={70}>
          {labels[1]}
        </Text>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect
              x={274 + (i % 2) * 39}
              y={87 + Math.floor(i / 2) * 51}
              width="32"
              height="43"
              rx="7"
              className="fill-primary/15"
            />
            <rect
              x={278 + (i % 2) * 39}
              y={91 + Math.floor(i / 2) * 51}
              width="24"
              height="23"
              rx="5"
              className="fill-primary/40"
            />
            <path
              d={`M${280 + (i % 2) * 39} ${122 + Math.floor(i / 2) * 51}h18`}
              className="stroke-primary/50"
              strokeWidth="3"
            />
          </g>
        ))}
        <Scene start={0.35} end={0.7}>
          <Badge x={272} y={196} width={76} label={labels[2]} />
        </Scene>
        <Scene start={0.7}>
          <Badge x={272} y={196} width={76} label={labels[3]} success />
        </Scene>
      </g>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0;0 -5;0 0"
          dur="4s"
          repeatCount="indefinite"
        />
        <rect
          x="131"
          y="20"
          width="110"
          height="216"
          rx="21"
          className="fill-card stroke-primary/45"
          strokeWidth="2"
        />
        <rect
          x="168"
          y="30"
          width="36"
          height="6"
          rx="3"
          className="fill-foreground/20"
        />
        <Text x={186} y={62}>
          {labels[4]}
        </Text>
        {Array.from({ length: 49 }, (_, i) => {
          const r = Math.floor(i / 7),
            c = i % 7;
          return (r < 3 && c < 3) ||
            (r < 3 && c > 3) ||
            (r > 3 && c < 3) ||
            (i * 7) % 11 < 5 ? (
            <rect
              key={i}
              x={152 + c * 10}
              y={80 + r * 10}
              width="8"
              height="8"
              rx="1.5"
              className="fill-foreground/75"
            />
          ) : null;
        })}
        <rect
          x="147"
          y="80"
          width="80"
          height="3"
          rx="1.5"
          className="fill-primary"
        >
          <animate
            attributeName="y"
            values="80;147;80"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </rect>
        <Scene start={0.6}>
          <Badge x={146} y={178} width={80} label={labels[5]} success />
        </Scene>
      </g>
      <Text x={186} y={250}>
        {labels[6]}
      </Text>
    </>
  );
}
function AiDiagram({ labels }: DiagramProps) {
  return (
    <>
      <Scene start={0} end={0.38}>
        <Badge x={18} y={12} width={225} label={labels[0]} />
      </Scene>
      <Scene start={0.38}>
        <Badge x={18} y={12} width={225} label={labels[1]} success />
      </Scene>
      {Array.from({ length: 12 }, (_, i) => {
        const x = 18 + (i % 4) * 61,
          y = 58 + Math.floor(i / 4) * 47,
          bad = i === 2 || i === 6;
        return (
          <g key={i}>
            <Scene start={0} end={0.4 + (i % 4) * 0.06}>
              <g transform={`rotate(${i % 2 ? 3 : -3} ${x + 26} ${y + 18})`}>
                <rect
                  x={x}
                  y={y}
                  width="51"
                  height="36"
                  rx="8"
                  className={
                    bad
                      ? "fill-destructive/5 stroke-destructive/60"
                      : "fill-muted/40 stroke-border"
                  }
                  strokeDasharray="4 3"
                />
                <path
                  d={`M${x + 8} ${y + 12}h23M${x + 8} ${y + 23}h31`}
                  className={
                    bad ? "stroke-destructive/50" : "stroke-foreground/20"
                  }
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            </Scene>
            <Scene start={0.4 + (i % 4) * 0.06}>
              <rect
                x={x}
                y={y}
                width="51"
                height="36"
                rx="8"
                className="fill-primary/10 stroke-primary/20"
              />
              <path
                d={`M${x + 8} ${y + 12}h20M${x + 8} ${y + 23}h31`}
                className="stroke-primary/50"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx={x + 41} cy={y + 10} r="4" className="fill-success" />
            </Scene>
          </g>
        );
      })}
      <Scene start={0.35} end={0.78}>
        <rect x="12" y="50" width="3" height="151" className="fill-primary">
          <animate
            attributeName="x"
            values="12;12;262;262"
            keyTimes="0;.35;.75;1"
            dur="10s"
            repeatCount="indefinite"
          />
        </rect>
      </Scene>
      {[0, 1, 2, 3].map((i) => (
        <Scene key={i} start={0.46 + i * 0.08}>
          <Badge
            x={276}
            y={58 + i * 30}
            width={92}
            label={labels[i + 2]}
            success
          />
        </Scene>
      ))}
      <Scene start={0.8}>
        <path
          d="m321 182 22 9v16q0 17-22 28-22-11-22-28v-16z"
          className="fill-primary/20 stroke-primary"
          strokeWidth="2.5"
        />
        <path
          d="m312 207 7 7 13-15"
          className="stroke-success"
          fill="none"
          strokeWidth="3"
        />
      </Scene>
      <Text x={186} y={249}>
        {labels[6]}
      </Text>
    </>
  );
}

export function ExpertiseVisual({
  image,
  visualType,
  nodes,
  paused = false,
}: ExpertiseVisualProps) {
  const ref = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();
  const labels = nodes.map((node) => node.label);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof svg.pauseAnimations !== "function") return;
    if (reducedMotion) {
      svg.setCurrentTime(9);
      svg.pauseAnimations();
    } else if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused, reducedMotion]);
  return (
    <div className="relative h-full w-full">
      {image ? (
        <MediaImage
          src={image}
          alt=""
          fill
          sizes="24rem"
          className="rounded-2xl object-contain"
        />
      ) : (
        <svg
          ref={ref}
          aria-hidden="true"
          viewBox="0 0 372 260"
          className="h-full w-full overflow-visible"
          data-visual-type={visualType}
        >
          {visualType === "network" && <NetworkDiagram labels={labels} />}
          {visualType === "architecture" && (
            <ArchitectureDiagram labels={labels} />
          )}
          {visualType === "frontend" && <FrontendDiagram labels={labels} />}
          {visualType === "pipeline" && <PipelineDiagram labels={labels} />}
          {visualType === "security" && <SecurityDiagram labels={labels} />}
          {visualType === "mobile" && <MobileDiagram labels={labels} />}
          {visualType === "ai" && <AiDiagram labels={labels} />}
        </svg>
      )}
    </div>
  );
}
