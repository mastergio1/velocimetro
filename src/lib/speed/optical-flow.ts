export type FlowVector = { x: number; y: number; dx: number; dy: number };

export type FlowResult = {
  dx: number;
  dy: number;
  pxPerSec: number;
  confidence: number;
  quality: number;
  vectors: FlowVector[];
};

const PATCH = 5;
const HALF = 2;
const SEARCH = 7;
const COLS = 8;
const ROWS = 5;

function sad(
  prev: Uint8Array,
  next: Uint8Array,
  w: number,
  h: number,
  x: number,
  y: number,
  dx: number,
  dy: number,
): number {
  let s = 0;
  for (let py = -HALF; py <= HALF; py++) {
    const y0 = y + py;
    const y1 = y0 + dy;
    if (y0 < 0 || y1 < 0 || y0 >= h || y1 >= h) return 1e9;
    const row0 = y0 * w;
    const row1 = y1 * w;
    for (let px = -HALF; px <= HALF; px++) {
      const x0 = x + px;
      const x1 = x0 + dx;
      if (x0 < 0 || x1 < 0 || x0 >= w || x1 >= w) return 1e9;
      s += Math.abs((prev[row0 + x0] ?? 0) - (next[row1 + x1] ?? 0));
    }
  }
  return s;
}

function patchVariance(buf: Uint8Array, w: number, h: number, x: number, y: number): number {
  let sum = 0;
  let n = 0;
  for (let py = -HALF; py <= HALF; py++) {
    const yy = y + py;
    if (yy < 0 || yy >= h) continue;
    const row = yy * w;
    for (let px = -HALF; px <= HALF; px++) {
      const xx = x + px;
      if (xx < 0 || xx >= w) continue;
      sum += buf[row + xx] ?? 0;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  let v = 0;
  for (let py = -HALF; py <= HALF; py++) {
    const yy = y + py;
    if (yy < 0 || yy >= h) continue;
    const row = yy * w;
    for (let px = -HALF; px <= HALF; px++) {
      const xx = x + px;
      if (xx < 0 || xx >= w) continue;
      const d = (buf[row + xx] ?? 0) - mean;
      v += d * d;
    }
  }
  return v / n;
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

export function rgbaToGray(data: Uint8ClampedArray, out: Uint8Array) {
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    out[j++] = ((data[i] ?? 0) * 77 + (data[i + 1] ?? 0) * 150 + (data[i + 2] ?? 0) * 29) >> 8;
  }
}

export class FlowTracker {
  readonly w: number;
  readonly h: number;
  private prev: Uint8Array;
  private next: Uint8Array;
  private hasPrev = false;
  readonly vectors: FlowVector[] = [];

  constructor(w = 160, h = 90) {
    this.w = w;
    this.h = h;
    this.prev = new Uint8Array(w * h);
    this.next = new Uint8Array(w * h);
  }

  reset() {
    this.hasPrev = false;
    this.vectors.length = 0;
  }

  push(imageData: ImageData, dt: number): FlowResult {
    rgbaToGray(imageData.data, this.next);
    if (!this.hasPrev) {
      this.prev.set(this.next);
      this.hasPrev = true;
      return {
        dx: 0,
        dy: 0,
        pxPerSec: 0,
        confidence: 0,
        quality: 0,
        vectors: this.vectors,
      };
    }

    const w = this.w;
    const h = this.h;
    const prev = this.prev;
    const next = this.next;
    this.vectors.length = 0;

    const yMin = Math.floor(h * 0.38);
    const yMax = Math.floor(h * 0.92);
    const xMin = Math.floor(w * 0.08);
    const xMax = Math.floor(w * 0.92);
    const dxs: number[] = [];
    const dys: number[] = [];

    for (let r = 0; r < ROWS; r++) {
      const y = Math.round(yMin + ((yMax - yMin) * (r + 0.5)) / ROWS);
      for (let c = 0; c < COLS; c++) {
        const x = Math.round(xMin + ((xMax - xMin) * (c + 0.5)) / COLS);
        if (patchVariance(prev, w, h, x, y) < 48) continue;

        let best = 1e9;
        let bx = 0;
        let by = 0;
        for (let dy = -SEARCH; dy <= SEARCH; dy++) {
          for (let dx = -SEARCH; dx <= SEARCH; dx++) {
            const e = sad(prev, next, w, h, x, y, dx, dy);
            if (e < best) {
              best = e;
              bx = dx;
              by = dy;
            }
          }
        }

        const meanAbs = best / (PATCH * PATCH);
        if (meanAbs > 28) continue;
        this.vectors.push({ x, y, dx: bx, dy: by });
        dxs.push(bx);
        dys.push(by);
      }
    }

    const mdx = median(dxs);
    const mdy = median(dys);
    const inliers = this.vectors.filter(
      (v) => Math.hypot(v.dx - mdx, v.dy - mdy) < 2.2,
    );
    const confidence =
      this.vectors.length === 0
        ? 0
        : Math.min(1, (inliers.length / (COLS * ROWS)) * 1.8);

    const pan = Math.abs(mdx) > Math.abs(mdy) * 1.8;
    const quality = pan ? confidence * 0.35 : confidence;
    const safeDt = Math.max(dt, 1 / 60);
    const pxPerSec = mdy / safeDt;

    const tmp = this.prev;
    this.prev = this.next;
    this.next = tmp;

    return {
      dx: mdx,
      dy: mdy,
      pxPerSec,
      confidence,
      quality,
      vectors: this.vectors,
    };
  }
}

export function flowSpeedMps(
  vectors: FlowVector[],
  bbox: { x: number; y: number; w: number; h: number },
  frameW: number,
  distanceM: number,
  dt: number,
  hfovRad: number,
): { speedMps: number; confidence: number } {
  if (dt <= 0 || distanceM <= 0 || frameW <= 0) return { speedMps: 0, confidence: 0 };
  const x1 = bbox.x;
  const y1 = bbox.y;
  const x2 = bbox.x + bbox.w;
  const y2 = bbox.y + bbox.h;
  const inside = vectors.filter((v) => v.x >= x1 && v.x <= x2 && v.y >= y1 && v.y <= y2);
  if (inside.length < 2) return { speedMps: 0, confidence: 0 };
  const pxps = median(inside.map((v) => Math.hypot(v.dx, v.dy) / dt));
  const f = frameW / 2 / Math.tan(hfovRad / 2);
  const mps = (pxps * distanceM) / Math.max(8, f);
  return {
    speedMps: Math.min(155, mps),
    confidence: Math.min(1, inside.length / 8),
  };
}
