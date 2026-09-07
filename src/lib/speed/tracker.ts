import type { BBox } from "./types";

type Sample = { t: number; x: number; z: number };

/** Typical smartphone wide camera. Not tied to a single iPhone model. */
export const HFOV = (70 * Math.PI) / 180;

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export class RangeTracker {
  private samples: Sample[] = [];
  private speeds: number[] = [];
  speedMps = 0;
  distanceM = 0;
  confidence = 0;

  reset() {
    this.samples = [];
    this.speeds = [];
    this.speedMps = 0;
    this.distanceM = 0;
    this.confidence = 0;
  }

  push(
    bbox: BBox,
    frameW: number,
    assumedWidthM: number,
    sensitivity: number,
    now: number,
    flowMps = 0,
    flowConf = 0,
  ) {
    const f = frameW / 2 / Math.tan(HFOV / 2);
    const w = Math.max(8, bbox.w);
    const dist = (assumedWidthM * f) / w;
    const cx = bbox.x + bbox.w / 2;
    const x = ((cx - frameW / 2) / f) * dist;
    this.distanceM = dist;
    this.samples.push({ t: now, x, z: dist });
    if (this.samples.length > 18) this.samples.shift();
    if (this.samples.length < 4) {
      this.confidence = 0.2;
      if (flowConf > 0.3 && flowMps > 0) {
        this.speeds.push(Math.min(155, flowMps * sensitivity));
        if (this.speeds.length > 9) this.speeds.shift();
        this.speedMps = median(this.speeds);
        this.confidence = Math.max(this.confidence, flowConf * 0.7);
      }
      return;
    }
    const a = this.samples[0]!;
    const b = this.samples[this.samples.length - 1]!;
    const dt = (b.t - a.t) / 1000;
    if (dt < 0.12) return;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const rangeV = Math.min(155, (Math.hypot(dx, dz) / dt) * sensitivity);
    const useFlow = flowConf >= 0.22 && flowMps > 0;
    const raw = useFlow ? rangeV * 0.55 + Math.min(155, flowMps * sensitivity) * 0.45 : rangeV;
    this.speeds.push(raw);
    if (this.speeds.length > 9) this.speeds.shift();
    this.speedMps = median(this.speeds);
    this.confidence = Math.min(
      1,
      (this.samples.length / 12) * 0.75 + (useFlow ? flowConf * 0.25 : 0),
    );
  }
}
