import type { BBox } from "./types";

export function findPlateBoxes(gray: Uint8Array, w: number, h: number): BBox[] {
  if (w < 24 || h < 24) return [];
  const y0 = Math.floor(h * 0.36);
  const gw = 32;
  const gh = 18;
  const cellW = w / gw;
  const cellH = h / gh;
  const heat = new Float32Array(gw * gh);

  for (let y = y0; y < h - 1; y++) {
    const gy = Math.min(gh - 1, Math.floor(y / cellH));
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const gx = Math.min(gw - 1, Math.floor(x / cellW));
      const edge = Math.abs((gray[row + x + 1] ?? 0) - (gray[row + x - 1] ?? 0));
      if (edge < 26) continue;
      const v = gray[row + x] ?? 0;
      if (v < 70 || v > 245) continue;
      heat[gy * gw + gx] += edge;
    }
  }

  const visited = new Uint8Array(gw * gh);
  const boxes: BBox[] = [];

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
        if (visited[ni] || (heat[ni] ?? 0) < 90) continue;
        visited[ni] = 1;
        stack.push(ni);
      }
    }
    return { minX, maxX, minY, maxY, mass };
  };

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      if (visited[i] || (heat[i] ?? 0) < 160) continue;
      const r = flood(x, y);
      const bw = r.maxX - r.minX + 1;
      const bh = r.maxY - r.minY + 1;
      if (bw < 3 || bh < 1) continue;
      const aspect = bw / Math.max(1, bh);
      if (aspect < 1.6 || aspect > 6.2) continue;
      const px = (r.minX / gw) * w;
      const py = (r.minY / gh) * h;
      const pw = (bw / gw) * w;
      const ph = (bh / gh) * h;
      if (py + ph < h * 0.38) continue;
      if (pw * ph < w * h * 0.006 || pw * ph > w * h * 0.18) continue;
      const padX = pw * 0.12;
      const padY = ph * 0.28;
      boxes.push({
        x: Math.max(0, px - padX),
        y: Math.max(0, py - padY),
        w: Math.min(w - (px - padX), pw + padX * 2),
        h: Math.min(h - (py - padY), ph + padY * 2),
      });
    }
  }

  boxes.sort((a, b) => b.w * b.h - a.w * a.h);
  return boxes.slice(0, 2);
}

export function tapePlateBoxes(
  ctx: CanvasRenderingContext2D,
  boxes: BBox[],
): number {
  for (const b of boxes) {
    ctx.fillStyle = "#08090b";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "rgba(236, 239, 242, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  }
  return boxes.length;
}

export function redactPlatesFromImageData(img: ImageData, ctx: CanvasRenderingContext2D): number {
  const gray = new Uint8Array(img.width * img.height);
  const d = img.data;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    gray[j] = ((d[i] ?? 0) * 77 + (d[i + 1] ?? 0) * 150 + (d[i + 2] ?? 0) * 29) >> 8;
  }
  const boxes = findPlateBoxes(gray, img.width, img.height);
  return tapePlateBoxes(ctx, boxes);
}
