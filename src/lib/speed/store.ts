import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  MEMORY_KEY,
  MEMORY_MAX,
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
  setSettings: (patch: Partial<Settings>) => void;
  hydrate: () => void;
  remember: (id: VehicleId, speedMps: number, lockId?: string | null) => void;
  clearMemory: () => void;
};

export const useVelox = create<VeloxStore>((set, get) => ({
  ...initialLive,
  settings: { ...DEFAULT_SETTINGS },
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ settings: loadSettings(), memory: loadMemory(), hydrated: true });
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
    set({
      memory,
      identification: vehicle,
      identifiedLockId: lockId ?? get().lock?.id ?? null,
      identifyStatus: "idle",
      identifyError: null,
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
    }
  },
  clearMemory: () => {
    set({ memory: [] });
    if (typeof window !== "undefined") window.localStorage.removeItem(MEMORY_KEY);
  },
}));
