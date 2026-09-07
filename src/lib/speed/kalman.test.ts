import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BoxKalman } from "./kalman.ts";

describe("BoxKalman", () => {
  it("holds still after one update", () => {
    const k = new BoxKalman();
    k.update({ x: 100, y: 80, w: 40, h: 20 }, 0.03);
    const a = k.box();
    k.predict(0.03);
    const b = k.box();
    assert.ok(Math.abs(a.x - b.x) < 1);
  });

  it("coasts in the direction of motion", () => {
    const k = new BoxKalman();
    k.update({ x: 40, y: 80, w: 40, h: 20 }, 0.04);
    k.update({ x: 60, y: 80, w: 40, h: 20 }, 0.04);
    const before = k.box().x;
    k.predict(0.04);
    const coast = k.coast();
    assert.ok(coast.x > before, `expected ${coast.x} > ${before}`);
  });
});
