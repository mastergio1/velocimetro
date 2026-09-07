import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractJson, normalizeImage, clip } from "./identify.ts";

describe("normalizeImage", () => {
  it("rejects URLs and junk that would SSRF or run script", () => {
    assert.equal(normalizeImage("http://evil.test/car.jpg"), null);
    assert.equal(normalizeImage("https://x.ai/p.png"), null);
    assert.equal(normalizeImage("javascript:alert(1)"), null);
    assert.equal(normalizeImage("file:///etc/passwd"), null);
    assert.equal(normalizeImage("short"), null);
  });

  it("accepts a jpeg data URL", () => {
    const raw = "A".repeat(40);
    const n = normalizeImage(`data:image/jpeg;base64,${raw}`);
    assert.equal(n, `data:image/jpeg;base64,${raw}`);
  });
});

describe("extractJson", () => {
  it("parses a fenced model reply and drops unknown", () => {
    const text = '```json\n{"make":"Toyota","model":"Corolla","year":"2022","color":"plata","klass":"sedan","description":"Sedán.","funFact":"Dato."}\n```';
    const id = extractJson(text);
    assert.equal(id?.make, "Toyota");
    assert.equal(id?.model, "Corolla");
    assert.equal(extractJson('{"make":"unknown","model":"x"}'), null);
    assert.equal(extractJson("no json here"), null);
  });

  it("clips XSS and does not keep extra keys", () => {
    const id = extractJson(
      JSON.stringify({
        make: "<script>x</script>",
        model: "A".repeat(80),
        year: "2020",
        color: "rojo",
        description: "<img onerror=alert(1)>",
        funFact: "ok",
        klass: "sedan",
        admin: true,
        __proto__: { polluted: true },
      }),
    );
    assert.ok(id);
    assert.ok((id!.model as string).length <= 48);
    assert.equal(Object.prototype.hasOwnProperty.call(id, "admin"), false);
    assert.equal((id as { polluted?: boolean }).polluted, undefined);
    assert.ok(clip("<svg>", 3).length <= 3);
  });
});
