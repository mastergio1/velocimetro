import type { BBox } from "./types";

export type MotionBox = BBox & { score: number };

export function rgbaToGray(data: Uint8ClampedArray, out: Uint8Array) {
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    out[j++] = ((data[i] ?? 0) * 77 + (data[i + 1] ?? 0) * 150 + (data[i + 2] ?? 0) * 29) >> 8;
  }
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
    if (gy < gh * 0.22) continue;
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const d = Math.abs((next[row + x] ?? 0) - (prev[row + x] ?? 0));
      if (d < 22) continue;
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
        if ((heat[ni] ?? 0) < 140) continue;
        visited[ni] = 1;
        stack.push(ni);
      }
    }
    return { minX, maxX, minY, maxY, mass };
  };

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      if (visited[i] || (heat[i] ?? 0) < 220) continue;
      const r = flood(x, y);
      const bw = r.maxX - r.minX + 1;
      const bh = r.maxY - r.minY + 1;
      if (bw < 3 || bh < 2) continue;
      const aspect = bw / bh;
      if (aspect < 0.9 || aspect > 4.2) continue;
      const px = (r.minX / gw) * width;
      const py = (r.minY / gh) * height;
      const pw = (bw / gw) * width;
      const ph = (bh / gh) * height;
      if (pw * ph < width * height * 0.012) continue;
      boxes.push({
        x: px,
        y: py,
        w: pw,
        h: ph,
        score: r.mass,
      });
    }
  }

  boxes.sort((a, b) => b.score - a.score);
  return boxes.slice(0, 5);
}

export function pickLock(
  boxes: MotionBox[],
  frameW: number,
  frameH: number,
  prevId: string | null,
  prevBox: BBox | null,
): MotionBox | null {
  if (boxes.length === 0) return null;
  const cx = frameW / 2;
  const cy = frameH * 0.58;
  if (prevBox && prevId) {
    const overlap = boxes.find((b) => iou(b, prevBox) > 0.18);
    if (overlap) return overlap;
  }
  let best = boxes[0]!;
  let bestD = Infinity;
  for (const b of boxes) {
    const dx = b.x + b.w / 2 - cx;
    const dy = b.y + b.h / 2 - cy;
    const d = dx * dx + dy * dy * 0.6;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
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
