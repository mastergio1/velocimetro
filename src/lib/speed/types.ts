export type Units = "kmh" | "mph";
export type CameraFacing = "environment" | "user";

export type Settings = {
  units: Units;
  cameraFacing: CameraFacing;
  assumedWidthM: number;
  sensitivity: number;
  speedLimitKmh: number;
  showBoxes: boolean;
};

export type BBox = { x: number; y: number; w: number; h: number };

export type VehicleId = {
  make: string;
  model: string;
  year: string;
  color: string;
  description: string;
  funFact: string;
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
};

export const DEFAULT_SETTINGS: Settings = {
  units: "kmh",
  cameraFacing: "environment",
  assumedWidthM: 1.8,
  sensitivity: 1,
  speedLimitKmh: 120,
  showBoxes: true,
};

export const HISTORY_LEN = 96;
export const MEMORY_KEY = "velox-garage";
export const MEMORY_MAX = 40;
export const IDENTIFY_MAX = 10;
