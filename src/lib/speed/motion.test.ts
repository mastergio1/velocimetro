import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickLock, pickObject, pickTarget, isVehicleLike, isObjectLike, findMovingRegions, grabPatch, trackPatch, type MotionBox } from "./motion.ts";

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

  it("prefers a road-band car over tree flicker", () => {
    const tree = box(200, 8, 90, 40, 900);
    const car = box(140, 90, 70, 28, 200);
    assert.equal(pickLock([tree, car], 400, 220, null, null), car);
  });
});

describe("isVehicleLike", () => {
  it("rejects a close pedestrian-sized box", () => {
    assert.equal(isVehicleLike({ x: 80, y: 80, w: 70, h: 420 }, 390, 700, 1.2), false);
  });

  it("accepts a close van crossing the intersection", () => {
    assert.equal(isVehicleLike({ x: 40, y: 240, w: 160, h: 70 }, 390, 700, 5.2), true);
  });

  it("rejects a mural-sized box that would read 2 m", () => {
    assert.equal(isVehicleLike({ x: 20, y: 120, w: 240, h: 180 }, 390, 700, 2), false);
  });

  it("accepts a mid-road car box", () => {
    assert.equal(isVehicleLike({ x: 120, y: 280, w: 110, h: 55 }, 390, 700, 18), true);
  });
});

describe("isObjectLike", () => {
  it("accepts a bicycle-sized box that cars would skip", () => {
    assert.equal(isObjectLike({ x: 160, y: 260, w: 40, h: 90 }, 390, 700), true);
  });

  it("rejects a mural-sized blob", () => {
    assert.equal(isObjectLike({ x: 10, y: 40, w: 360, h: 500 }, 390, 700), false);
  });

  it("rejects a wide ground strip", () => {
    assert.equal(isObjectLike({ x: 10, y: 480, w: 320, h: 70 }, 390, 700), false);
  });
});

describe("pickObject", () => {
  it("prefers a person over a ground patch", () => {
    const ground = box(20, 70, 80, 18, 90);
    const skater = box(90, 40, 18, 40, 40);
    const picked = pickObject([ground, skater], 200, 120, null);
    assert.equal(picked, skater);
  });
});

describe("pickTarget", () => {
  it("picks a car over a tree in disparo", () => {
    const tree = box(20, 8, 16, 50, 80);
    const car = box(80, 46, 52, 22, 50);
    const picked = pickTarget([tree, car], 200, 120, null);
    assert.equal(picked, car);
  });
});

describe("findMovingRegions", () => {
  it("finds a translating rectangle on the road band", () => {
    const w = 160;
    const h = 90;
    const a = new Uint8Array(w * h).fill(30);
    const b = new Uint8Array(w * h).fill(30);
    const paint = (buf: Uint8Array, x0: number, y0: number) => {
      for (let y = y0; y < y0 + 16; y++) {
        for (let x = x0; x < x0 + 44; x++) buf[y * w + x] = 210;
      }
    };
    paint(a, 18, 36);
    paint(b, 40, 36);
    const boxes = findMovingRegions(a, b, w, h);
    assert.ok(boxes.length >= 1, "expected a motion blob");
    const cy = boxes[0]!.y + boxes[0]!.h / 2;
    assert.ok(cy > h * 0.28 && cy < h * 0.65, `cy ${cy}`);
  });

  it("finds a tall skater-like blob in object mode", () => {
    const w = 160;
    const h = 90;
    const a = new Uint8Array(w * h).fill(30);
    const b = new Uint8Array(w * h).fill(30);
    const paint = (buf: Uint8Array, x0: number, y0: number, bw: number, bh: number) => {
      for (let y = y0; y < y0 + bh; y++) {
        for (let x = x0; x < x0 + bw; x++) buf[y * w + x] = 210;
      }
    };
    paint(a, 70, 22, 14, 36);
    paint(b, 82, 22, 14, 36);
    const boxes = findMovingRegions(a, b, w, h, "object");
    assert.ok(boxes.length >= 1, "expected an object blob");
    const aspect = boxes[0]!.w / Math.max(1, boxes[0]!.h);
    assert.ok(aspect < 1.4, `aspect ${aspect}`);
  });
});

describe("trackPatch", () => {
  it("follows a shifted rectangle", () => {
    const w = 80;
    const h = 50;
    const frame = new Uint8Array(w * h).fill(20);
    for (let y = 18; y < 30; y++) for (let x = 22; x < 50; x++) frame[y * w + x] = 200;
    const grabbed = grabPatch(frame, w, h, { x: 22, y: 18, w: 28, h: 12 });
    const shifted = new Uint8Array(frame);
    for (let y = 18; y < 30; y++) {
      for (let x = 22; x < 50; x++) shifted[y * w + x] = 20;
      for (let x = 28; x < 56; x++) shifted[y * w + x] = 200;
    }
    const moved = trackPatch(shifted, grabbed.data, grabbed.tw, grabbed.th, w, h, grabbed.box, 10);
    assert.ok(moved);
    assert.ok(moved!.x > grabbed.box.x + 2, `x ${moved!.x} vs ${grabbed.box.x}`);
  });
});
