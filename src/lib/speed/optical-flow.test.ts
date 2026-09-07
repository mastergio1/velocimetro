import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { flowSpeedMps, type FlowVector } from "./optical-flow.ts";

describe("flowSpeedMps", () => {
  it("returns 0 without enough vectors in the lock", () => {
    const r = flowSpeedMps([], { x: 0, y: 0, w: 40, h: 20 }, 240, 12, 0.05, 1.22);
    assert.equal(r.speedMps, 0);
  });

  it("turns pixels inside the bbox into a finite speed", () => {
    const vectors: FlowVector[] = [
      { x: 20, y: 20, dx: 4, dy: 0 },
      { x: 24, y: 22, dx: 5, dy: 0 },
      { x: 28, y: 18, dx: 4, dy: 1 },
      { x: 200, y: 10, dx: 90, dy: 0 },
    ];
    const r = flowSpeedMps(vectors, { x: 10, y: 10, w: 40, h: 30 }, 240, 15, 0.05, 1.22);
    assert.ok(r.speedMps > 0);
    assert.ok(r.speedMps < 155);
    assert.ok(r.confidence > 0);
  });
});
