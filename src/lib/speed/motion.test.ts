import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickLock, type MotionBox } from "./motion.ts";

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

  it("sticks to the previous box when it still overlaps", () => {
    const prev = box(20, 80, 50, 30);
    const moved = box(24, 84, 50, 30);
    const other = box(200, 120, 50, 30);
    const picked = pickLock([other, moved], 400, 220, "lock-1", prev);
    assert.equal(picked, moved);
  });
});
