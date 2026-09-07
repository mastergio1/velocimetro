import { useMemo } from "react";

const MARKS: { deg: number; label: string }[] = [];
for (let d = 0; d < 360; d += 15) {
  const cardinal: Record<number, string> = {
    0: "N",
    45: "NE",
    90: "E",
    135: "SE",
    180: "S",
    225: "SO",
    270: "O",
    315: "NO",
  };
  MARKS.push({ deg: d, label: cardinal[d] ?? String(d) });
}

export function HeadingTape({ heading }: { heading: number | null }) {
  const hdg = heading == null ? 0 : ((heading % 360) + 360) % 360;
  const pxPerDeg = 4.4;
  const offset = useMemo(() => hdg * pxPerDeg, [hdg]);

  const strip = [...MARKS, ...MARKS, ...MARKS];

  return (
    <div className="relative mx-auto h-9 w-full max-w-lg overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-bg to-transparent" />
      <div
        className="absolute top-0 left-1/2 flex h-full items-end"
        style={{
          transform: `translateX(calc(-50% - ${offset}px - ${360 * pxPerDeg}px))`,
        }}
      >
        {strip.map((m, i) => (
          <div
            key={`${m.deg}-${i}`}
            className="flex shrink-0 flex-col items-center justify-end"
            style={{ width: 15 * pxPerDeg }}
          >
            <span
              className={
                m.label.length <= 2
                  ? "font-condensed text-xs font-semibold tracking-wide text-hud"
                  : "text-xs text-faint"
              }
            >
              {m.label}
            </span>
            <span
              className={
                m.label.length <= 2
                  ? "mt-0.5 h-2 w-px bg-hud"
                  : "mt-0.5 h-1 w-px bg-faint"
              }
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-3 w-px -translate-x-1/2 bg-fg" />
    </div>
  );
}
