import type { BBox } from "./types";

type Sample = { t: number; x: number; z: number };

const HFOV = (66 * Math.PI) / 180;

export class RangeTracker {
  private samples: Sample[] = [];
  speedMps = 0;
  distanceM = 0;
  confidence = 0;

  reset() {
    this.samples = [];
    this.speedMps = 0;
    this.distanceM = 0;
    this.confidence = 0;
  }

  push(bbox: BBox, frameW: number, assumedWidthM: number, sensitivity: number, now: number) {
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
      return;
    }
    const a = this.samples[0]!;
    const b = this.samples[this.samples.length - 1]!;
    const dt = (b.t - a.t) / 1000;
    if (dt < 0.12) return;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const raw = Math.hypot(dx, dz) / dt;
    const v = Math.min(155, raw * sensitivity);
    this.speedMps = this.speedMps * 0.55 + v * 0.45;
    this.confidence = Math.min(1, this.samples.length / 12);
  }
}
