import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { median, RangeTracker } from "./tracker.ts";

describe("median", () => {
  it("drops outliers", () => {
    assert.equal(median([31, 11, 30, 16, 14, 200, 17]), 17);
  });
});

describe("RangeTracker", () => {
  it("estimates speed from closing range", () => {
    const t = new RangeTracker();
    const frameW = 400;
    for (let i = 0; i < 8; i++) {
      const w = 40 + i * 6;
      t.push({ x: 180, y: 100, w, h: 28 }, frameW, 1.8, 1, i * 80);
    }
    assert.ok(t.speedMps > 1, `expected motion, got ${t.speedMps}`);
    assert.ok(t.distanceM > 0);
  });

  it("fuses optical-flow speed when confident", () => {
    const t = new RangeTracker();
    t.push({ x: 160, y: 90, w: 80, h: 36 }, 400, 1.8, 1, 0, 0, 0);
    t.push({ x: 160, y: 90, w: 82, h: 36 }, 400, 1.8, 1, 80, 0, 0);
    t.push({ x: 160, y: 90, w: 84, h: 36 }, 400, 1.8, 1, 160, 0, 0);
    t.push({ x: 160, y: 90, w: 86, h: 36 }, 400, 1.8, 1, 240, 28, 0.8);
    assert.ok(t.speedMps > 5, `flow should lift speed, got ${t.speedMps}`);
  });

  it("reports speed after two lateral samples", () => {
    const t = new RangeTracker();
    t.push({ x: 70, y: 100, w: 60, h: 28 }, 400, 1.8, 1, 0);
    t.push({ x: 150, y: 100, w: 60, h: 28 }, 400, 1.8, 1, 120);
    assert.ok(t.speedMps > 2, `expected lateral speed, got ${t.speedMps}`);
  });
});
