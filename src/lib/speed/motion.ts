import type { BBox } from "./types";

export type MotionBox = BBox & { score: number };

export function rgbaToGray(data: Uint8ClampedArray, out: Uint8Array) {
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    out[j++] = ((data[i] ?? 0) * 77 + (data[i + 1] ?? 0) * 150 + (data[i + 2] ?? 0) * 29) >> 8;
  }
}

export function insetBox(b: BBox, t = 0.1): BBox {
  const x = b.x + b.w * t;
  const y = b.y + b.h * t * 0.55;
  const w = b.w * (1 - t * 2);
  const h = b.h * (1 - t * 1.3);
  return { x, y, w: Math.max(8, w), h: Math.max(8, h) };
}

/** Drop only obvious people-in-your-face. Cars must pass. */
export function isVehicleLike(b: BBox, frameW: number, frameH: number, distM?: number): boolean {
  const aspect = b.w / Math.max(1, b.h);
  if (aspect < 0.85 || aspect > 4.6) return false;
  if (b.h > frameH * 0.55) return false;
  const cy = b.y + b.h / 2;
  if (cy < frameH * 0.12 || cy > frameH * 0.9) return false;
  if (distM != null && distM < 1.8) return false;
  return true;
}

export function findMovingRegions(
  prev: Uint8Array,
  next: Uint8Array,
  width: number,
  height: number,
): MotionBox[] {
  const gw = 40;
  const gh = 24;
  const cellW = width / gw;
  const cellH = height / gh;
  const heat = new Float32Array(gw * gh);

  for (let y = 0; y < height; y++) {
    const gy = Math.min(gh - 1, Math.floor(y / cellH));
    if (gy < gh * 0.12 || gy > gh * 0.92) continue;
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const d = Math.abs((next[row + x] ?? 0) - (prev[row + x] ?? 0));
      if (d < 16) continue;
      const gx = Math.min(gw - 1, Math.floor(x / cellW));
      heat[gy * gw + gx] += d;
    }
  }

  const visited = new Uint8Array(gw * gh);
  const boxes: MotionBox[] = [];

  const flood = (sx: number, sy: number) => {
    let minX = sx;
    let maxX = sx;
    let minY = sy;
    let maxY = sy;
    let mass = 0;
    const stack = [sy * gw + sx];
    visited[sy * gw + sx] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % gw;
      const y = (i / gw) | 0;
      mass += heat[i] ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ] as const) {
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const ni = ny * gw + nx;
        if (visited[ni]) continue;
        if ((heat[ni] ?? 0) < 110) continue;
        visited[ni] = 1;
        stack.push(ni);
      }
    }
    return { minX, maxX, minY, maxY, mass };
  };

  const frameA = width * height;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      if (visited[i] || (heat[i] ?? 0) < 160) continue;
      const r = flood(x, y);
      const bw = r.maxX - r.minX + 1;
      const bh = r.maxY - r.minY + 1;
      if (bw < 2 || bh < 2) continue;
      const aspect = bw / bh;
      if (aspect < 0.85 || aspect > 4.8) continue;
      const raw = {
        x: (r.minX / gw) * width,
        y: (r.minY / gh) * height,
        w: (bw / gw) * width,
        h: (bh / gh) * height,
      };
      const area = raw.w * raw.h;
      if (area < frameA * 0.004 || area > frameA * 0.5) continue;
      if (raw.h > height * 0.58) continue;
      const tight = insetBox(raw, 0.08);
      boxes.push({ ...tight, score: r.mass });
    }
  }

  boxes.sort((a, b) => b.score - a.score);
  return boxes.slice(0, 6);
}

export function pickLock(
  boxes: MotionBox[],
  frameW: number,
  frameH: number,
  prevId: string | null,
  prevBox: BBox | null,
  _roi: BBox | null = null,
): MotionBox | null {
  if (boxes.length === 0) return null;
  const pool = boxes;
  const cx = frameW / 2;
  const cy = frameH * 0.45;
  if (prevBox && prevId) {
    let sticky: MotionBox | null = null;
    let stickyIou = 0;
    for (const b of pool) {
      const o = iou(b, prevBox);
      if (o > stickyIou) {
        stickyIou = o;
        sticky = b;
      }
    }
    if (sticky && stickyIou > 0.18) return sticky;
    if (sticky && stickyIou > 0.08 && sticky.score >= (pool[0]?.score ?? 0) * 0.45) {
      return sticky;
    }
  }
  let best = pool[0]!;
  let bestD = Infinity;
  for (const b of pool) {
    const d = dist2(b, cx, cy);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

function dist2(b: BBox, cx: number, cy: number) {
  const dx = b.x + b.w / 2 - cx;
  const dy = b.y + b.h / 2 - cy;
  return dx * dx + dy * dy * 0.55;
}

function iou(a: BBox, b: BBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}
