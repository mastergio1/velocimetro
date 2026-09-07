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

function project(
  x: number,
  y: number,
  z: number,
  vpX: number,
  vpY: number,
  camH: number,
  focal: number,
) {
  const zz = Math.max(z, 0.35);
  return {
    x: vpX + (x * focal) / zz,
    y: vpY + ((camH - y) * focal) / zz,
  };
}

function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  fill: string,
) {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: RoadState,
  live: boolean,
  cars: SimCar[],
): ScreenTarget[] {
  const bounce = live ? Math.sin(state.t * 4.2) * 0.6 : 0;
  const vpX = w * 0.5 + Math.sin(state.t * 0.09) * w * 0.008;
  const vpY = h * 0.4 + bounce;
  const camH = 1.28;
  const focal = h * 0.78;
  const p = (x: number, y: number, z: number) => project(x, y, z, vpX, vpY, camH, focal);

  const sky = ctx.createLinearGradient(0, 0, 0, vpY + h * 0.08);
  sky.addColorStop(0, "#07080c");
  sky.addColorStop(0.55, "#0b1018");
  sky.addColorStop(1, "#18222c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 42; i++) {
    const sx = ((i * 97 + 13) % 173) / 173;
    const sy = ((i * 53 + 29) % 89) / 89;
    ctx.fillStyle = "rgba(210, 222, 232, 0.55)";
    ctx.fillRect(sx * w, sy * vpY * 0.92, i % 7 === 0 ? 2 : 1, 1);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(0, vpY + 8);
  const peaks = 7;
  for (let i = 0; i <= peaks; i++) {
    const x = (w * i) / peaks;
    const y = vpY - 18 - ((i * 37) % 23) - (i % 2) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, vpY + 12);
  ctx.closePath();
  ctx.fillStyle = "#0e131a";
  ctx.fill();

  const ground = ctx.createLinearGradient(0, vpY, 0, h);
  ground.addColorStop(0, "#141a22");
  ground.addColorStop(1, "#0a0c10");
  ctx.fillStyle = ground;
  ctx.fillRect(0, vpY, w, h - vpY);

  const zNear = 1.6;
  const zFar = 90;
  const halfRoad = 4.2;
  const farL = p(-halfRoad, 0, zFar);
  const farR = p(halfRoad, 0, zFar);
  const nearL = p(-halfRoad, 0, zNear);
  const nearR = p(halfRoad, 0, zNear);
  fillPoly(ctx, [farL, farR, nearR, nearL], "#161a21");

  const shoulder = 0.45;
  fillPoly(
    ctx,
    [p(-halfRoad - shoulder, 0, zFar), farL, nearL, p(-halfRoad - shoulder, 0, zNear)],
    "#1c222b",
  );
  fillPoly(
    ctx,
    [farR, p(halfRoad + shoulder, 0, zFar), p(halfRoad + shoulder, 0, zNear), nearR],
    "#1c222b",
  );

  ctx.beginPath();
  ctx.strokeStyle = "rgba(200, 210, 220, 0.28)";
  ctx.lineWidth = Math.max(1, h * 0.004);
  const edgeL0 = p(-halfRoad + 0.12, 0.01, zFar);
  const edgeL1 = p(-halfRoad + 0.12, 0.01, zNear);
  ctx.moveTo(edgeL0.x, edgeL0.y);
  ctx.lineTo(edgeL1.x, edgeL1.y);
  const edgeR0 = p(halfRoad - 0.12, 0.01, zFar);
  const edgeR1 = p(halfRoad - 0.12, 0.01, zNear);
  ctx.moveTo(edgeR0.x, edgeR0.y);
  ctx.lineTo(edgeR1.x, edgeR1.y);
  ctx.stroke();

  const dashLen = 3.4;
  const gap = 7.2;
  const period = dashLen + gap;
  const phase = state.distance % period;
  for (let z = 3.2 + ((period - phase) % period); z < 78; z += period) {
    const a = p(-0.08, 0.02, z);
    const b = p(0.08, 0.02, z);
    const c = p(0.1, 0.02, z + dashLen);
    const d = p(-0.1, 0.02, z + dashLen);
    fillPoly(ctx, [a, b, c, d], "rgba(214, 224, 232, 0.72)");
  }

  const postPeriod = 9;
  const postPhase = state.distance % postPeriod;
  for (let z = 4 + ((postPeriod - postPhase) % postPeriod); z < 70; z += postPeriod) {
    const fade = 1 - z / 80;
    ctx.globalAlpha = 0.35 + fade * 0.45;
    for (const side of [-1, 1]) {
      const base = p(side * (halfRoad + 0.7), 0, z);
      const top = p(side * (halfRoad + 0.7), 1.05, z);
      ctx.strokeStyle = "rgba(170, 184, 196, 0.55)";
      ctx.lineWidth = Math.max(1, 4 * fade);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  const ordered = [...cars].sort((a, b) => b.z - a.z);
  const targets: ScreenTarget[] = [];
  for (const car of ordered) {
    const spec = FLEET.find((f) => f.id === car.fleetId);
    if (!spec) continue;
    const target = drawCar(ctx, p, w, h, car, spec);
    if (target) targets.push(target);
  }

  const vignette = ctx.createRadialGradient(w / 2, h * 0.48, h * 0.1, w / 2, h * 0.5, h * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  return targets;
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  p: (x: number, y: number, z: number) => { x: number; y: number },
  w: number,
  h: number,
  car: SimCar,
  spec: (typeof FLEET)[number],
): ScreenTarget | null {
  const z0 = car.z;
  const z1 = car.z + spec.lengthM;
  if (z0 > 82 || z1 < 5.5) return null;
  const x = car.lane;
  const half = spec.widthM / 2;
  const roof = spec.heightM;
  const glass = spec.heightM * 0.62;

  const body = [
    p(x - half, 0.05, z0),
    p(x + half, 0.05, z0),
    p(x + half, 0.05, z1),
    p(x - half, 0.05, z1),
  ];
  const cabin = [
    p(x - half * 0.72, glass, z0 + spec.lengthM * 0.28),
    p(x + half * 0.72, glass, z0 + spec.lengthM * 0.28),
    p(x + half * 0.78, roof, z0 + spec.lengthM * 0.55),
    p(x - half * 0.78, roof, z0 + spec.lengthM * 0.55),
  ];
  fillPoly(ctx, body, spec.body);
  fillPoly(
    ctx,
    [
      p(x - half, 0.05, z0),
      p(x + half, 0.05, z0),
      p(x + half * 0.9, roof * 0.55, z0),
      p(x - half * 0.9, roof * 0.55, z0),
    ],
    spec.body,
  );
  fillPoly(ctx, cabin, spec.glass);

  const lightL = p(x - half * 0.55, 0.55, z0);
  const lightR = p(x + half * 0.55, 0.55, z0);
  ctx.fillStyle = "rgba(232, 236, 242, 0.85)";
  ctx.beginPath();
  ctx.arc(lightL.x, lightL.y, Math.max(1.5, 7 * (8 / z0)), 0, Math.PI * 2);
  ctx.arc(lightR.x, lightR.y, Math.max(1.5, 7 * (8 / z0)), 0, Math.PI * 2);
  ctx.fill();

  const pts = [...body, ...cabin];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of pts) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  if (!Number.isFinite(minX)) return null;
  const pad = 6;
  const bbox = {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(w, maxX + pad) - Math.max(0, minX - pad),
    h: Math.min(h, maxY + pad) - Math.max(0, minY - pad),
  };
  if (bbox.w < 8 || bbox.h < 6) return null;
  return {
    id: car.id,
    fleetId: car.fleetId,
    speedMps: car.speedMps,
    distanceM: car.z,
    bbox,
  };
}
