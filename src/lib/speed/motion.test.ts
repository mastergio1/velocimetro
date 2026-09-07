import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickLock, isVehicleLike, type MotionBox } from "./motion.ts";

function box(x: number, y: number, w = 40, h = 24, score = 1): MotionBox {
  return { x, y, w, h, score };
}

describe("pickLock", () => {
  it("returns null when nothing moves", () => {
    assert.equal(pickLock([], 400, 220, null, null), null);
  });

  it("prefers the box closest to the reticle", () => {
    const left = box(10, 40);
    const center = box(180, 110);
    const picked = pickLock([left, center], 400, 220, null, null);
    assert.equal(picked, center);
  });

  it("does not jump to a far box while the lock still overlaps", () => {
    const prev = box(20, 80, 50, 30, 80);
    const moved = box(30, 86, 48, 28, 70);
    const far = box(220, 40, 80, 40, 200);
    const picked = pickLock([far, moved], 400, 220, "lock-1", prev);
    assert.equal(picked, moved);
  });
});

describe("isVehicleLike", () => {
  it("rejects a close pedestrian-sized box", () => {
    assert.equal(isVehicleLike({ x: 80, y: 80, w: 70, h: 420 }, 390, 700, 1.2), false);
  });

  it("accepts a close van crossing the intersection", () => {
    assert.equal(isVehicleLike({ x: 40, y: 240, w: 220, h: 70 }, 390, 700, 5.2), true);
  });

  it("accepts a mid-road car box", () => {
    assert.equal(isVehicleLike({ x: 120, y: 280, w: 110, h: 55 }, 390, 700, 18), true);
  });
});
