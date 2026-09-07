import { create } from "zustand";
import {
  CATALOG,
  inferGamma,
  matchCatalog,
  wildId,
  type WildEntry,
} from "./catalog";
import {
  DEFAULT_SETTINGS,
  DEX_KEY,
  MEMORY_KEY,
  MEMORY_MAX,
  WILD_KEY,
  WILD_MAX,
  type LiveState,
  type MemoryEntry,
  type Settings,
  type VehicleId,
} from "./types";

function loadSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem("velox-settings");
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadMemory(): MemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MemoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MEMORY_MAX) : [];
  } catch {
    return [];
  }
}

function loadUnlocks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [];
    const known = new Set(CATALOG.map((c) => c.id));
    return parsed.filter((id) => known.has(id));
  } catch {
    return [];
  }
}

function loadWilds(): WildEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WILD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WildEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, WILD_MAX) : [];
  } catch {
    return [];
  }
}

function persistDex(unlocks: string[], wilds: WildEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEX_KEY, JSON.stringify(unlocks));
  window.localStorage.setItem(WILD_KEY, JSON.stringify(wilds));
}

function asVehicle(id: VehicleId): VehicleId {
  return {
    make: id.make,
    model: id.model,
    year: id.year,
    color: id.color,
    description: id.description,
    funFact: id.funFact,
  };
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
};

type VeloxStore = LiveState & {
  settings: Settings;
  hydrated: boolean;
  unlocks: string[];
  wilds: WildEntry[];
  lastUnlockId: string | null;
  setSettings: (patch: Partial<Settings>) => void;
  hydrate: () => void;
  remember: (id: VehicleId, speedMps: number, lockId?: string | null) => void;
  clearMemory: () => void;
  resetCatalog: () => void;
};

function applyUnlock(
  vehicle: VehicleId,
  unlocks: string[],
  wilds: WildEntry[],
): { unlocks: string[]; wilds: WildEntry[]; lastUnlockId: string } {
  const hit = matchCatalog(vehicle.make, vehicle.model);
  if (hit) {
    if (unlocks.includes(hit.id)) {
      return { unlocks, wilds, lastUnlockId: hit.id };
    }
    return { unlocks: [hit.id, ...unlocks], wilds, lastUnlockId: hit.id };
  }

  const id = wildId(vehicle.make, vehicle.model);
  const entry: WildEntry = {
    id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    description: vehicle.description,
    funFact: vehicle.funFact,
    gamma: inferGamma(vehicle.make, vehicle.model),
    at: Date.now(),
  };
  const rest = wilds.filter((w) => w.id !== id);
  return {
    unlocks,
    wilds: [entry, ...rest].slice(0, WILD_MAX),
    lastUnlockId: id,
  };
}

export const useVelox = create<VeloxStore>((set, get) => ({
  ...initialLive,
  settings: { ...DEFAULT_SETTINGS },
  hydrated: false,
  unlocks: [],
  wilds: [],
  lastUnlockId: null,
  hydrate: () => {
    if (get().hydrated) return;
    const memory = loadMemory();
    let unlocks = loadUnlocks();
    let wilds = loadWilds();
    for (const m of memory) {
      const next = applyUnlock(m, unlocks, wilds);
      unlocks = next.unlocks;
      wilds = next.wilds;
    }
    persistDex(unlocks, wilds);
    set({
      settings: loadSettings(),
      memory,
      unlocks,
      wilds,
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
    const dex = applyUnlock(vehicle, get().unlocks, get().wilds);
    persistDex(dex.unlocks, dex.wilds);
    set({
      memory,
      identification: vehicle,
      identifiedLockId: lockId ?? get().lock?.id ?? null,
      identifyStatus: "idle",
      identifyError: null,
      unlocks: dex.unlocks,
      wilds: dex.wilds,
      lastUnlockId: dex.lastUnlockId,
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
    }
  },
  clearMemory: () => {
    set({ memory: [] });
    if (typeof window !== "undefined") window.localStorage.removeItem(MEMORY_KEY);
  },
  resetCatalog: () => {
    set({ unlocks: [], wilds: [], lastUnlockId: null });
    persistDex([], []);
  },
}));
