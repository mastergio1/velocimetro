import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assumedSpanM, lookupWheelbase } from "./wheelbase.ts";

describe("lookupWheelbase", () => {
  it("finds a known model", () => {
    assert.equal(lookupWheelbase("Toyota", "Corolla"), 2.7);
  });

  it("falls back by class", () => {
    assert.equal(lookupWheelbase("MarcaRara", "X", "pickup"), 3.2);
  });
});

describe("assumedSpanM", () => {
  it("uses width on a frontal box", () => {
    assert.equal(assumedSpanM({ w: 40, h: 32 }, 1.8, 2.7), 1.8);
  });

  it("uses wheelbase on a side box", () => {
    assert.equal(assumedSpanM({ w: 80, h: 28 }, 1.8, 2.7), 2.7);
  });
});
