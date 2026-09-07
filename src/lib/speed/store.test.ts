import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { COLLECTION_KEY, MEMORY_KEY } from "./types.ts";
import { useVelox } from "./store.ts";

const bag = new Map<string, string>();

function installWindow() {
  const localStorage = {
    getItem: (k: string) => bag.get(k) ?? null,
    setItem: (k: string, v: string) => {
      bag.set(k, v);
    },
    removeItem: (k: string) => {
      bag.delete(k);
    },
  };
  (globalThis as { window?: { localStorage: typeof localStorage } }).window = { localStorage };
}

installWindow();

const sample = {
  make: "Toyota",
  model: "Corolla",
  year: "2022",
  color: "plata",
  description: "Sedán. Patente ABCD12 no va.",
  funFact: "Dato.",
};

beforeEach(() => {
  bag.clear();
  useVelox.setState({
    hydrated: false,
    collection: [],
    memory: [],
    lastUnlockId: null,
    settings: { ...useVelox.getState().settings, incognito: false },
    identification: null,
  });
});

describe("hydrate", () => {
  it("ignores poisoned collection JSON", () => {
    bag.set(COLLECTION_KEY, '{"__proto__":{"admin":true}}');
    useVelox.getState().hydrate();
    assert.equal(useVelox.getState().collection.length, 0);
    assert.equal(({} as { admin?: boolean }).admin, undefined);
  });

  it("drops oversized blobs", () => {
    bag.set(COLLECTION_KEY, "x".repeat(800_000));
    useVelox.getState().hydrate();
    assert.equal(useVelox.getState().collection.length, 0);
  });
});

describe("remember", () => {
  it("unlocks a car into the catalog", () => {
    useVelox.getState().hydrate();
    useVelox.getState().remember(sample, 12);
    assert.ok(useVelox.getState().collection.length >= 1);
    assert.equal(useVelox.getState().collection[0]?.make, "Toyota");
    assert.ok(bag.has(COLLECTION_KEY));
  });

  it("does not persist in incognito", () => {
    useVelox.getState().hydrate();
    bag.delete(COLLECTION_KEY);
    bag.delete(MEMORY_KEY);
    useVelox.getState().setSettings({ incognito: true });
    useVelox.getState().remember(sample, 12);
    assert.equal(bag.has(COLLECTION_KEY), false);
    assert.equal(bag.has(MEMORY_KEY), false);
    assert.equal(useVelox.getState().memory.length, 0);
  });
});
