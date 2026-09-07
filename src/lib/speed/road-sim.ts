import { FLEET } from "./catalog";

export type RoadState = {
  t: number;
  distance: number;
  speedMps: number;
  heading: number;
};

export type SimCar = {
  id: string;
  fleetId: string;
  z: number;
  lane: number;
  speedMps: number;
};

export type ScreenTarget = {
  id: string;
  fleetId: string;
  speedMps: number;
  distanceM: number;
  bbox: { x: number; y: number; w: number; h: number };
};

const LANES = [-2.05, 2.05];
const PLATE = "/demo/night.jpg";

let plate: HTMLImageElement | null = null;

function plateImg() {
  if (typeof Image === "undefined") return null;
  if (!plate) {
    plate = new Image();
    plate.src = PLATE;
  }
  return plate;
}

export function seedCars(): SimCar[] {
  return FLEET.map((f, i) => ({
    id: `sim-${f.id}`,
    fleetId: f.id,
    z: 18 + i * 8,
    lane: LANES[i % 2]!,
    speedMps: 6.2 + (i % 4) * 1.15 + (i % 2) * 0.4,
  }));
}

export function tickCars(cars: SimCar[], dt: number): SimCar[] {
  return cars.map((c, i) => {
    let z = c.z - c.speedMps * dt;
    if (z < 7.2) {
      return {
        ...c,
        z: 76 + (i % 3) * 7,
        speedMps: 6 + ((i * 5) % 9) * 0.45,
        lane: LANES[c.lane > 0 ? 0 : 1]!,
      };
    }
    return { ...c, z };
  });
}

export function tickRoad(state: RoadState, dt: number, live: boolean): RoadState {
  const t = state.t + dt;
  return {
    t,
    speedMps: 0,
    distance: live ? state.distance + 1.6 * dt : state.distance,
    heading: (18 + Math.sin(t * 0.045) * 11 + Math.sin(t * 0.11) * 4 + 360) % 360,
  };
}

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _state: RoadState,
  _live: boolean,
  _cars: SimCar[],
): ScreenTarget[] {
  const img = plateImg();
  if (img && img.complete && img.naturalWidth > 0) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#07090d";
    ctx.fillRect(0, 0, w, h);
  }
  return [];
}
