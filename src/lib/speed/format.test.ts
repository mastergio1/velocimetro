import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickGaugeMax, toDisplaySpeed, formatSpeed } from "./format.ts";

describe("gauge scale", () => {
  it("stays at 180 for street speeds", () => {
    assert.equal(pickGaugeMax(40, "kmh"), 180);
    assert.equal(pickGaugeMax(120, "kmh"), 180);
  });

  it("opens for F1 and hypercars", () => {
    assert.equal(pickGaugeMax(300, "kmh"), 400);
    assert.equal(pickGaugeMax(420, "kmh"), 500);
  });

  it("holds the higher scale until speed drops", () => {
    assert.equal(pickGaugeMax(250, "kmh", 400), 400);
    assert.equal(pickGaugeMax(20, "kmh", 400), 180);
  });
});

describe("formatSpeed", () => {
  it("does not clamp high values", () => {
    assert.equal(formatSpeed(100, "kmh"), "360");
    assert.ok(toDisplaySpeed(100, "kmh") > 240);
  });
});
