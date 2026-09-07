import type { BBox } from "./types";

export type MotionBox = BBox & { score: number };

export function rgbaToGray(data: Uint8ClampedArray, out: Uint8Array) {
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    out[j++] = ((data[i] ?? 0) * 77 + (data[i + 1] ?? 0) * 150 + (data[i + 2] ?? 0) * 29) >> 8;
  }
}

export function insetBox(b: BBox, t = 0.14): BBox {
  const x = b.x + b.w * t;
  const y = b.y + b.h * t * 0.7;
  const w = b.w * (1 - t * 2);
  const h = b.h * (1 - t * 1.6);
  return { x, y, w: Math.max(8, w), h: Math.max(8, h) };
}

export function isVehicleLike(b: BBox, frameW: number, frameH: number, distM?: number): boolean {
  const aspect = b.w / Math.max(1, b.h);
  if (aspect < 1.05 || aspect > 3.4) return false;
  if (b.h > frameH * 0.38) return false;
  if (b.w > frameW * 0.82) return false;
  const cy = b.y + b.h / 2;
  if (cy < frameH * 0.22 || cy > frameH * 0.78) return false;
  if (distM != null && (distM < 3.5 || distM > 140)) return false;
  return true;
}

function estimateShift(
  prev: Uint8Array,
  next: Uint8Array,
  w: number,
  h: number,
): { dx: number; dy: number } {
  const dxs: number[] = [];
  const dys: number[] = [];
  for (const fy of [0.34, 0.5, 0.64]) {
    for (const fx of [0.22, 0.5, 0.78]) {
      const x = (fx * w) | 0;
      const y = (fy * h) | 0;
      let best = 1e9;
      let bdx = 0;
      let bdy = 0;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          let s = 0;
          outer: for (let py = -2; py <= 2; py++) {
            const y0 = y + py;
            const y1 = y0 + dy;
            if (y0 < 0 || y1 < 0 || y0 >= h || y1 >= h) {
              s = 1e9;
              break;
            }
            const r0 = y0 * w;
            const r1 = y1 * w;
            for (let px = -2; px <= 2; px++) {
              const x0 = x + px;
              const x1 = x0 + dx;
              if (x0 < 0 || x1 < 0 || x0 >= w || x1 >= w) {
                s = 1e9;
                break outer;
              }
              s += Math.abs((prev[r0 + x0] ?? 0) - (next[r1 + x1] ?? 0));
            }
          }
          if (s < best) {
            best = s;
            bdx = dx;
            bdy = dy;
          }
        }
      }
      dxs.push(bdx);
      dys.push(bdy);
    }
  }
  const med = (a: number[]) => {
    const s = a.slice().sort((x, y) => x - y);
    return s[s.length >> 1] ?? 0;
  };
  return { dx: med(dxs), dy: med(dys) };
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
  const shift = estimateShift(prev, next, width, height);

  for (let y = 0; y < height; y++) {
    const gy = Math.min(gh - 1, Math.floor(y / cellH));
    if (gy < gh * 0.18 || gy > gh * 0.86) continue;
    const y0 = y - shift.dy;
    if (y0 < 0 || y0 >= height) continue;
    const row = y * width;
    const row0 = y0 * width;
    for (let x = 0; x < width; x++) {
      const x0 = x - shift.dx;
      if (x0 < 0 || x0 >= width) continue;
      const d = Math.abs((next[row + x] ?? 0) - (prev[row0 + x0] ?? 0));
      if (d < 20) continue;
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
        if ((heat[ni] ?? 0) < 170) continue;
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
      if (visited[i] || (heat[i] ?? 0) < 260) continue;
      const r = flood(x, y);
      const bw = r.maxX - r.minX + 1;
      const bh = r.maxY - r.minY + 1;
      if (bw < 3 || bh < 2) continue;
      const aspect = bw / bh;
      if (aspect < 1.05 || aspect > 3.4) continue;
      const raw = {
        x: (r.minX / gw) * width,
        y: (r.minY / gh) * height,
        w: (bw / gw) * width,
        h: (bh / gh) * height,
      };
      const area = raw.w * raw.h;
      if (area < frameA * 0.008 || area > frameA * 0.32) continue;
      if (raw.h > height * 0.38) continue;
      const cy = raw.y + raw.h / 2;
      if (cy < height * 0.22 || cy > height * 0.78) continue;
      const tight = insetBox(raw, 0.13);
      boxes.push({ ...tight, score: r.mass });
    }
  }

  boxes.sort((a, b) => b.score - a.score);
  return boxes.slice(0, 4);
}

export function pickLock(
  boxes: MotionBox[],
  frameW: number,
  frameH: number,
  prevId: string | null,
  prevBox: BBox | null,
  roi: BBox | null = null,
): MotionBox | null {
  if (boxes.length === 0) return null;
  let pool = boxes;
  if (roi) {
    const inside = boxes.filter((b) => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      return cx >= roi.x && cx <= roi.x + roi.w && cy >= roi.y && cy <= roi.y + roi.h;
    });
    if (inside.length) pool = inside;
  }
  const cx = frameW / 2;
  const cy = frameH * 0.58;
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
    if (sticky && stickyIou > 0.26) return sticky;
    if (sticky && stickyIou > 0.12) {
      const center = pool.reduce((best, b) => {
        const d = dist2(b, cx, cy);
        return d < dist2(best, cx, cy) ? b : best;
      }, pool[0]!);
      if (sticky.score >= center.score * 0.55) return sticky;
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
