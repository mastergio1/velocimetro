import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findPlateBoxes } from "./plates.ts";

function paintPlate(w: number, h: number): Uint8Array {
  const g = new Uint8Array(w * h);
  g.fill(40);
  const px = Math.floor(w * 0.28);
  const py = Math.floor(h * 0.72);
  const pw = Math.floor(w * 0.44);
  const ph = Math.floor(h * 0.12);
  for (let y = py; y < py + ph; y++) {
    for (let x = px; x < px + pw; x++) {
      const stripe = Math.floor((x - px) / 3) % 2 === 0 ? 230 : 30;
      g[y * w + x] = stripe;
    }
  }
  return g;
}

describe("findPlateBoxes", () => {
  it("tapes a high-contrast plate in the lower third", () => {
    const w = 160;
    const h = 90;
    const boxes = findPlateBoxes(paintPlate(w, h), w, h);
    assert.ok(boxes.length >= 1, "expected a plate box");
    const b = boxes[0]!;
    assert.ok(b.y + b.h > h * 0.5, "plate should sit low on the car");
    assert.ok(b.w / b.h > 1.4);
  });

  it("ignores empty dark frames", () => {
    const g = new Uint8Array(80 * 50);
    g.fill(18);
    assert.equal(findPlateBoxes(g, 80, 50).length, 0);
  });
});
