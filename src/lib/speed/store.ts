import { create } from "zustand";
import {
  CATALOG,
  catalogById,
  entryKey,
  toCollectionEntry,
  wildId,
  type CollectionEntry,
  type WildEntry,
} from "./catalog.ts";
import {
  COLLECTION_KEY,
  COLLECTION_MAX,
  DEFAULT_SETTINGS,
  DEX_KEY,
  MEMORY_KEY,
  MEMORY_MAX,
  WILD_KEY,
  type LiveState,
  type MemoryEntry,
  type Settings,
  type VehicleId,
} from "./types.ts";

function loadSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem("velox-settings");
    if (!raw || raw.length > 4_000) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }
    const num = (v: unknown, min: number, max: number, fallback: number) => {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(max, Math.max(min, n));
    };
    return {
      units: parsed.units === "mph" ? "mph" : "kmh",
      cameraFacing: parsed.cameraFacing === "user" ? "user" : "environment",
      assumedWidthM: num(parsed.assumedWidthM, 1.4, 2.2, DEFAULT_SETTINGS.assumedWidthM),
      sensitivity: num(parsed.sensitivity, 0.4, 2.4, DEFAULT_SETTINGS.sensitivity),
      speedLimitKmh: num(parsed.speedLimitKmh, 20, 400, DEFAULT_SETTINGS.speedLimitKmh),
      showBoxes: parsed.showBoxes === true,
      showGuide: parsed.showGuide === false ? false : true,
      highFps: parsed.highFps === false ? false : true,
      incognito: parsed.incognito === true,
      gunMode: parsed.gunMode === "disparo" ? "disparo" : "pista",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadMemory(): MemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    if (raw.length > 750_000) return [];
    const parsed = JSON.parse(raw) as MemoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MEMORY_MAX) : [];
  } catch {
    return [];
  }
}

function loadCollection(): CollectionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    if (raw.length > 750_000) return [];
    const parsed = JSON.parse(raw) as CollectionEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, COLLECTION_MAX) : [];
  } catch {
    return [];
  }
}

function loadUnlocks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEX_KEY);
    if (!raw || raw.length > 20_000) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 80)
      .slice(0, 400);
  } catch {
    return [];
  }
}

function loadWilds(): WildEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WILD_KEY);
    if (!raw || raw.length > 750_000) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, COLLECTION_MAX) as WildEntry[];
  } catch {
    return [];
  }
}

function persistCollection(collection: CollectionEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}

function asVehicle(id: VehicleId): VehicleId {
  const scrub = (s: string) =>
    s
      .replace(/\b[A-Z]{4}\s?-?\s?\d{2}\b/gi, "")
      .replace(/\b[A-Z]{2}\s?-?\s?\d{4}\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  return {
    make: id.make,
    model: id.model,
    year: id.year,
    color: id.color,
    description: scrub(id.description),
    funFact: scrub(id.funFact),
    klass: id.klass,
  };
}

function upsertCollection(
  collection: CollectionEntry[],
  vehicle: VehicleId,
  speedKmh: number,
): { collection: CollectionEntry[]; lastUnlockId: string } {
  const key = entryKey(vehicle.make, vehicle.model);
  const idx = collection.findIndex(
    (e) => e.id === wildId(vehicle.make, vehicle.model) || entryKey(e.make, e.model) === key,
  );
  const prev = idx >= 0 ? collection[idx] : undefined;
  const next = toCollectionEntry(vehicle, speedKmh, prev);
  const rest = collection.filter((_, i) => i !== idx);
  return {
    collection: [next, ...rest].slice(0, COLLECTION_MAX),
    lastUnlockId: next.id,
  };
}

function migrateCollection(memory: MemoryEntry[]): CollectionEntry[] {
  const existing = loadCollection();
  if (existing.length > 0) {
    let cur = existing;
    for (const m of memory) {
      cur = upsertCollection(cur, m, m.speedKmh).collection;
    }
    return cur;
  }

  let cur: CollectionEntry[] = [];
  for (const id of loadUnlocks()) {
    const car = catalogById(id) ?? CATALOG.find((c) => c.id === id);
    if (!car) continue;
    cur = upsertCollection(cur, car, 0).collection;
  }
  for (const w of loadWilds()) {
    cur = upsertCollection(cur, w, 0).collection;
  }
  for (const m of memory) {
    cur = upsertCollection(cur, m, m.speedKmh).collection;
  }
  return cur;
}

const initialLive: LiveState = {
  speedMps: 0,
  instantMps: 0,
  history: [],
  cameraOn: false,
  cameraReady: false,
  cameraError: null,
  activeChannel: "demo",
  lock: null,
  boxes: [],
  identification: null,
  identifiedLockId: null,
  identifyStatus: "idle",
  identifyError: null,
  identifyCount: 0,
  memory: [],
  shot: null,
};

type VeloxStore = LiveState & {
  settings: Settings;
  hydrated: boolean;
  collection: CollectionEntry[];
  lastUnlockId: string | null;
  setSettings: (patch: Partial<Settings>) => void;
  hydrate: () => void;
  remember: (id: VehicleId, speedMps: number, lockId?: string | null) => void;
  clearMemory: () => void;
  resetCatalog: () => void;
};

export const useVelox = create<VeloxStore>((set, get) => ({
  ...initialLive,
  settings: { ...DEFAULT_SETTINGS },
  hydrated: false,
  collection: [],
  lastUnlockId: null,
  hydrate: () => {
    if (get().hydrated) return;
    const memory = loadMemory();
    const collection = migrateCollection(memory);
    persistCollection(collection);
    set({
      settings: loadSettings(),
      memory,
      collection,
      hydrated: true,
    });
  },
  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("velox-settings", JSON.stringify(settings));
    }
  },
  remember: (id, speedMps, lockId) => {
    const vehicle = asVehicle(id);
    const entry: MemoryEntry = {
      ...vehicle,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      speedKmh: Math.round(speedMps * 3.6),
      at: Date.now(),
    };
    const key = `${vehicle.make}|${vehicle.model}`.toLowerCase();
    const rest = get().memory.filter(
      (m) => `${m.make}|${m.model}`.toLowerCase() !== key,
    );
    const memory = [entry, ...rest].slice(0, MEMORY_MAX);
    const incognito = get().settings.incognito;
    const dex = incognito
      ? { collection: get().collection, lastUnlockId: get().lastUnlockId }
      : upsertCollection(get().collection, vehicle, entry.speedKmh);
    if (!incognito) persistCollection(dex.collection);
    set({
      memory: incognito ? get().memory : memory,
      identification: vehicle,
      identifiedLockId: lockId ?? get().lock?.id ?? null,
      identifyStatus: "idle",
      identifyError: null,
      collection: dex.collection,
      lastUnlockId: dex.lastUnlockId,
    });
    if (!incognito && typeof window !== "undefined") {
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
    }
  },
  clearMemory: () => {
    set({ memory: [] });
    if (typeof window !== "undefined") window.localStorage.removeItem(MEMORY_KEY);
  },
  resetCatalog: () => {
    set({ collection: [], lastUnlockId: null });
    persistCollection([]);
  },
}));

