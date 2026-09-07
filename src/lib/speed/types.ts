export type Units = "kmh" | "mph";
export type CameraFacing = "environment" | "user";
export type GunMode = "pista" | "disparo";

export type Settings = {
  units: Units;
  cameraFacing: CameraFacing;
  assumedWidthM: number;
  sensitivity: number;
  speedLimitKmh: number;
  showBoxes: boolean;
  showGuide: boolean;
  highFps: boolean;
  incognito: boolean;
  gunMode: GunMode;
};

export type BBox = { x: number; y: number; w: number; h: number };

export type VehicleId = {
  make: string;
  model: string;
  year: string;
  color: string;
  description: string;
  funFact: string;
  klass?: string;
  wheelbaseM?: number;
};

export type MemoryEntry = VehicleId & {
  id: string;
  speedKmh: number;
  at: number;
};

export type LockedTarget = {
  id: string;
  bbox: BBox;
  speedMps: number;
  distanceM: number;
  confidence: number;
  fleetId: string | null;
};

export type ShotResult = {
  lastMps: number;
  peakMps: number;
  meanMps: number;
  until: number;
};

export type LiveState = {
  speedMps: number;
  instantMps: number;
  history: number[];
  cameraOn: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  activeChannel: "demo" | "camera";
  lock: LockedTarget | null;
  boxes: { id: string; bbox: BBox }[];
  identification: VehicleId | null;
  identifiedLockId: string | null;
  identifyStatus: "idle" | "loading" | "error";
  identifyError: string | null;
  identifyCount: number;
  memory: MemoryEntry[];
  shot: ShotResult | null;
};

export const DEFAULT_SETTINGS: Settings = {
  units: "kmh",
  cameraFacing: "environment",
  assumedWidthM: 1.8,
  sensitivity: 1,
  speedLimitKmh: 120,
  showBoxes: false,
  showGuide: true,
  highFps: true,
  incognito: false,
  gunMode: "pista",
};

export const HISTORY_LEN = 96;
export const MEMORY_KEY = "velox-garage";
export const MEMORY_MAX = 80;
export const IDENTIFY_MAX = 80;
export const DEX_KEY = "velox-dex";
export const WILD_KEY = "velox-wilds";
export const COLLECTION_KEY = "velox-collection";
export const COLLECTION_MAX = 500;
