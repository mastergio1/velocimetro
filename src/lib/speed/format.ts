import type { Units } from "./types";

export const MS_TO_KMH = 3.6;
export const MS_TO_MPH = 2.2369362921;

const numCL = (opts: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("es-CL", opts);

export function toDisplaySpeed(mps: number, units: Units): number {
  return mps * (units === "mph" ? MS_TO_MPH : MS_TO_KMH);
}

export function speedUnit(units: Units): "km/h" | "mph" {
  return units === "mph" ? "mph" : "km/h";
}

export function gaugeMax(units: Units): number {
  return units === "mph" ? 160 : 240;
}

export const GAUGE_TIERS_KMH = [180, 240, 320, 400, 500] as const;
export const GAUGE_TIERS_MPH = [120, 160, 200, 250, 310] as const;

export function pickGaugeMax(display: number, units: Units, held?: number): number {
  const tiers = units === "mph" ? GAUGE_TIERS_MPH : GAUGE_TIERS_KMH;
  const needed = Math.max(0, display) / 0.84;
  let pick: number = tiers[0]!;
  for (const t of tiers) {
    pick = t;
    if (t >= needed) break;
  }
  if (held && held > pick && display > held * 0.52) return held;
  return pick;
}

export function gaugeTickPlan(max: number): { step: number; major: number } {
  if (max >= 400) return { step: 25, major: 100 };
  if (max >= 320) return { step: 20, major: 40 };
  if (max >= 240) return { step: 10, major: 40 };
  if (max >= 180) return { step: 10, major: 20 };
  return { step: 5, major: 20 };
}

export function formatSpeed(mps: number, units: Units): string {
  const v = Math.max(0, toDisplaySpeed(mps, units));
  return numCL({ maximumFractionDigits: 0 }).format(Math.round(v));
}

export function formatDistance(m: number, units: Units): { value: string; unit: string } {
  if (units === "mph") {
    const miles = m / 1609.344;
    if (miles < 0.1) {
      return {
        value: numCL({ maximumFractionDigits: 0 }).format(m * 3.28084),
        unit: "ft",
      };
    }
    return {
      value: numCL({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(miles),
      unit: "mi",
    };
  }
  if (m < 1000) {
    return {
      value: numCL({ maximumFractionDigits: 0 }).format(m),
      unit: "m",
    };
  }
  return {
    value: numCL({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(m / 1000),
    unit: "km",
  };
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(r)}`;
  return `${pad(m)}:${pad(r)}`;
}

export function formatHeading(deg: number | null): string {
  if (deg == null || Number.isNaN(deg)) return "—";
  const d = ((deg % 360) + 360) % 360;
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const idx = Math.round(d / 45) % 8;
  return `${Math.round(d)}° ${dirs[idx]}`;
}

export function formatAltitude(m: number | null, units: Units): string {
  if (m == null || Number.isNaN(m)) return "—";
  if (units === "mph") {
    return `${numCL({ maximumFractionDigits: 0 }).format(m * 3.28084)} ft`;
  }
  return `${numCL({ maximumFractionDigits: 0 }).format(m)} m`;
}

export function formatAccel(mps2: number, units: Units): string {
  const signed = mps2 >= 0 ? "+" : "−";
  const mag = Math.abs(mps2);
  if (units === "mph") {
    const mphS = mag * MS_TO_MPH;
    return `${signed}${numCL({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mphS)}`;
  }
  const kmhS = mag * MS_TO_KMH;
  return `${signed}${numCL({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kmhS)}`;
}

export function formatG(g: number): string {
  const signed = g >= 0 ? "+" : "−";
  return `${signed}${numCL({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(g))}`;
}

export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function limitInDisplay(limitKmh: number, units: Units): number {
  if (units === "mph") return limitKmh * 0.621371;
  return limitKmh;
}
