import { memo, useMemo, useRef } from "react";
import { gaugeTickPlan, limitInDisplay, pickGaugeMax, toDisplaySpeed } from "@/lib/speed/format";
import type { Units } from "@/lib/speed/types";

type Props = {
  speedMps: number;
  units: Units;
  limitKmh: number;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

const START = -120;
const SWEEP = 240;
const CX = 200;
const CY = 178;
const R = 148;

const Ticks = memo(function Ticks({ max }: { max: number }) {
  const items = useMemo(() => {
    const ticks: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      major: boolean;
      label?: { x: number; y: number; text: string };
    }[] = [];
    const { step, major: majorEvery } = gaugeTickPlan(max);
    for (let v = 0; v <= max; v += step) {
      const t = v / max;
      const deg = START + t * SWEEP;
      const major = v % majorEvery === 0;
      const inner = major ? R - 16 : R - 8;
      const a = polar(CX, CY, inner, deg);
      const b = polar(CX, CY, R, deg);
      const item: (typeof ticks)[number] = {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        major,
      };
      if (major) {
        const lp = polar(CX, CY, R - 30, deg);
        item.label = { x: lp.x, y: lp.y, text: String(v) };
      }
      ticks.push(item);
    }
    return ticks;
  }, [max]);

  return (
    <g>
      {items.map((t, i) => (
        <g key={i}>
          <line
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            className={t.major ? "stroke-hud/80" : "stroke-faint/70"}
            strokeWidth={t.major ? 1.6 : 1}
          />
          {t.label ? (
            <text
              x={t.label.x}
              y={t.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted font-condensed"
              fontSize={max >= 320 ? "10" : "11"}
              fontWeight="600"
            >
              {t.label.text}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
});

export function AnalogGauge({ speedMps, units, limitKmh }: Props) {
  const raw = Math.max(0, toDisplaySpeed(speedMps, units));
  const held = useRef(pickGaugeMax(raw, units));
  held.current = pickGaugeMax(raw, units, held.current);
  const max = held.current;
  const display = Math.min(max, raw);
  const angle = START + (display / max) * SWEEP;
  const needle = polar(CX, CY, R - 22, angle);
  const hub = polar(CX, CY, 0, 0);
  const limit = Math.min(max, limitInDisplay(limitKmh, units));
  const limitDeg = START + (limit / max) * SWEEP;
  const redStart = START + 0.82 * SWEEP;
  const over = display >= limit - 0.01 && limit > 0;

  return (
    <svg
      viewBox="0 0 400 230"
      className="mx-auto h-auto w-full max-h-32 max-w-sm min-[700px]:max-h-44"
      role="img"
      aria-label={`Velocímetro ${Math.round(raw)} de ${max}`}
    >
      <path
        d={arcPath(CX, CY, R, START, START + SWEEP)}
        className="stroke-line"
        fill="none"
        strokeWidth="10"
        strokeLinecap="butt"
      />
      <path
        d={arcPath(CX, CY, R, redStart, START + SWEEP)}
        className="stroke-danger/50"
        fill="none"
        strokeWidth="10"
      />
      <path
        d={arcPath(CX, CY, R, START, angle)}
        className={over ? "stroke-danger" : "stroke-hud"}
        fill="none"
        strokeWidth="10"
        strokeLinecap="butt"
      />
      <Ticks max={max} />
      <line
        x1={polar(CX, CY, R - 18, limitDeg).x}
        y1={polar(CX, CY, R - 18, limitDeg).y}
        x2={polar(CX, CY, R + 6, limitDeg).x}
        y2={polar(CX, CY, R + 6, limitDeg).y}
        className="stroke-warn"
        strokeWidth="2.5"
      />
      <line
        x1={hub.x}
        y1={hub.y}
        x2={needle.x}
        y2={needle.y}
        className={over ? "stroke-danger" : "stroke-fg"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r="7" className="fill-fg" />
      <circle cx={CX} cy={CY} r="3.2" className="fill-bg" />
      <text
        x={CX}
        y={222}
        textAnchor="middle"
        className="fill-faint font-condensed"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.12em"
      >
        0–{max}
      </text>
    </svg>
  );
}
