import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fichaText } from "./share.ts";

describe("fichaText", () => {
  it("builds a shareable ficha without empty lines junk", () => {
    const text = fichaText(
      {
        make: "Porsche",
        model: "911",
        year: "2020",
        color: "claro",
        description: "Ícono de motor trasero.",
        funFact: "El 911 es de 1963.",
      },
      "94 km/h",
    );
    assert.match(text, /VELOX · Porsche 911/);
    assert.match(text, /2020 · claro/);
    assert.match(text, /Dato · /);
    assert.match(text, /94 km\/h/);
  });
});
