import type { BBox } from "./types";

/** Alpha-beta lock: predicts where the same car will be next frame. */
export class BoxKalman {
  x = 0;
  y = 0;
  w = 40;
  h = 24;
  vx = 0;
  vy = 0;
  inited = false;
  misses = 0;

  reset() {
    this.inited = false;
    this.misses = 0;
    this.vx = 0;
    this.vy = 0;
  }

  box(): BBox {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h,
    };
  }

  predict(dt: number) {
    if (!this.inited) return;
    const t = Math.min(0.08, Math.max(0, dt));
    this.x += this.vx * t;
    this.y += this.vy * t;
  }

  update(b: BBox, dt: number) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    if (!this.inited) {
      this.x = cx;
      this.y = cy;
      this.w = b.w;
      this.h = b.h;
      this.inited = true;
      this.misses = 0;
      return;
    }
    const t = Math.max(1e-3, dt);
    const nx = this.x + (cx - this.x) * 0.38;
    const ny = this.y + (cy - this.y) * 0.38;
    this.vx = this.vx * 0.55 + ((nx - this.x) / t) * 0.45;
    this.vy = this.vy * 0.55 + ((ny - this.y) / t) * 0.45;
    this.x = nx;
    this.y = ny;
    this.w += (b.w - this.w) * 0.28;
    this.h += (b.h - this.h) * 0.28;
    this.misses = 0;
  }

  coast(): BBox {
    this.misses += 1;
    return this.box();
  }
}
