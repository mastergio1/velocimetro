import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  entryKey,
  inferGamma,
  matchCatalog,
  wildId,
  toCollectionEntry,
} from "./catalog.ts";

describe("matchCatalog", () => {
  it("hits known cars without caring about accents or extra words", () => {
    const a = matchCatalog("TOYOTA", "Corolla Hybrid");
    assert.equal(a?.id, "corolla");
    const b = matchCatalog("volkswagen", "golf gti");
    assert.equal(b?.gamma, "sport");
  });

  it("lets unknown brands through as wild, not a closed list", () => {
    assert.equal(matchCatalog("BYD", "Song Plus"), undefined);
    const wild = wildId("BYD", "Song Plus");
    assert.match(wild, /^wild-byd-song-plus$/);
  });
});

describe("inferGamma", () => {
  it("maps street, epic and mythic without a brand cap", () => {
    assert.equal(inferGamma("Toyota", "Corolla", "sedan"), "calle");
    assert.equal(inferGamma("Ferrari", "488 GTB"), "mito");
    assert.equal(inferGamma("Bugatti", "Chiron", "hyper"), "mito");
  });
});

describe("collection entry", () => {
  it("reuses the same key when you see the car again", () => {
    assert.equal(entryKey("Toyota", "Corolla"), entryKey("toyota", "COROLLA"));
    const v = {
      make: "BYD",
      model: "Song Plus",
      year: "2024",
      color: "blanco",
      description: "SUV chino.",
      funFact: "BYD fabrica también buses.",
    };
    const first = toCollectionEntry(v, 40);
    const again = toCollectionEntry(v, 80, first);
    assert.equal(again.id, first.id);
    assert.equal(again.sightings, 2);
    assert.equal(again.lastSpeedKmh, 80);
  });
});
