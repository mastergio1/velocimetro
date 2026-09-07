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

export function roadScore(b: BBox, frameH: number): number {
  const cy = (b.y + b.h / 2) / frameH;
  if (cy >= 0.32 && cy <= 0.56) return 1;
  if (cy >= 0.26 && cy <= 0.64) return 0.4;
  return 0.05;
}
export function isVehicleLike(b: BBox, frameW: number, frameH: number, distM?: number): boolean {
  const aspect = b.w / Math.max(1, b.h);
  if (aspect < 0.85 || aspect > 4.6) return false;
  if (b.h > frameH * 0.4) return false;
  if (b.w > frameW * 0.46) return false;
  const cy = b.y + b.h / 2;
  if (cy < frameH * 0.18 || cy > frameH * 0.78) return false;
  if (distM != null && distM < 3.2) return false;
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
    if (gy < gh * 0.24 || gy > gh * 0.64) continue;
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
      if (bw < 2 || bh < 2 || bw > 16 || bh > 10) continue;
      const aspect = bw / bh;
      if (aspect < 0.85 || aspect > 4.8) continue;
      const raw = {
        x: (r.minX / gw) * width,
        y: (r.minY / gh) * height,
        w: (bw / gw) * width,
        h: (bh / gh) * height,
      };
      const area = raw.w * raw.h;
      if (area < frameA * 0.004 || area > frameA * 0.16) continue;
      if (raw.h > height * 0.36 || raw.w > width * 0.44) continue;
      const tight = insetBox(raw, 0.08);
      const aspectN =
        tight.w / Math.max(1, tight.h) >= 1.15 && tight.w / Math.max(1, tight.h) <= 3.8
          ? 1
          : 0.35;
      boxes.push({
        ...tight,
        score: r.mass * roadScore(tight, height) * aspectN,
      });
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
  const cy = frameH * 0.44;
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
    if (sticky && stickyIou > 0.18 && roadScore(sticky, frameH) >= 0.4) return sticky;
    if (
      sticky &&
      stickyIou > 0.08 &&
      roadScore(sticky, frameH) >= 0.4 &&
      sticky.score >= (pool[0]?.score ?? 0) * 0.35
    ) {
      return sticky;
    }
  }
  let best = pool[0]!;
  let bestS = -1;
  for (const b of pool) {
    const d = dist2(b, cx, cy);
    const s = (b.score * roadScore(b, frameH)) / (1 + d / (frameW * frameW * 0.2));
    if (s > bestS) {
      bestS = s;
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

export function grabPatch(
  frame: Uint8Array,
  width: number,
  height: number,
  box: BBox,
): { data: Uint8Array; tw: number; th: number; box: BBox } {
  const tw = Math.max(16, Math.min(64, Math.round(box.w)));
  const th = Math.max(10, Math.min(36, Math.round(box.h)));
  const x0 = Math.round(box.x + (box.w - tw) / 2);
  const y0 = Math.round(box.y + (box.h - th) / 2);
  const data = new Uint8Array(tw * th);
  for (let y = 0; y < th; y++) {
    const fy = Math.min(height - 1, Math.max(0, y0 + y));
    const row = fy * width;
    const tr = y * tw;
    for (let x = 0; x < tw; x++) {
      const fx = Math.min(width - 1, Math.max(0, x0 + x));
      data[tr + x] = frame[row + fx] ?? 0;
    }
  }
  return { data, tw, th, box: { x: x0, y: y0, w: tw, h: th } };
}

/** Follow a gray patch by SAD. Same-size box, shifted. */
export function trackPatch(
  frame: Uint8Array,
  tmpl: Uint8Array,
  tw: number,
  th: number,
  width: number,
  height: number,
  guess: BBox,
  search = 14,
): BBox | null {
  const gx = Math.round(guess.x);
  const gy = Math.round(guess.y);
  let best = 1e15;
  let bx = gx;
  let by = gy;
  for (let dy = -search; dy <= search; dy++) {
    for (let dx = -search; dx <= search; dx++) {
      const x0 = gx + dx;
      const y0 = gy + dy;
      if (x0 < 0 || y0 < 0 || x0 + tw > width || y0 + th > height) continue;
      let s = 0;
      for (let y = 0; y < th; y++) {
        const fr = (y0 + y) * width + x0;
        const tr = y * tw;
        for (let x = 0; x < tw; x++) s += Math.abs((frame[fr + x] ?? 0) - (tmpl[tr + x] ?? 0));
      }
      if (s < best) {
        best = s;
        bx = x0;
        by = y0;
      }
    }
  }
  if (best / (tw * th) > 48) return null;
  return { x: bx, y: by, w: guess.w, h: guess.h };
}
