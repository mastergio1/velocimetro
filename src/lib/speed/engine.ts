import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { cameraErrorMessage, openCamera } from "./camera";
import { fleetById } from "./catalog";
import { requestMotionPermission } from "./gps";
import { findMovingRegions, pickLock, rgbaToGray } from "./motion";
import { FlowTracker, flowSpeedMps } from "./optical-flow";
import {
  drawRoad,
  seedCars,
  tickCars,
  tickRoad,
  type RoadState,
  type SimCar,
} from "./road-sim";
import { redactPlatesFromImageData } from "./plates";
import { useVelox } from "./store";
import { HFOV, RangeTracker } from "./tracker";
import { HISTORY_LEN, type BBox, type LockedTarget } from "./types";

const ANALYSIS_W = 240;
const ANALYSIS_H = 135;

export type EngineRefs = {
  videoRef: RefObject<HTMLVideoElement | null>;
  simRef: RefObject<HTMLCanvasElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  analysisRef: RefObject<HTMLCanvasElement | null>;
};

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
) {
  if (sw <= 0 || sh <= 0) return;
  const sAspect = sw / sh;
  const dAspect = dw / dh;
  let sx = 0;
  let sy = 0;
  let cw = sw;
  let ch = sh;
  if (sAspect > dAspect) {
    cw = sh * dAspect;
    sx = (sw - cw) / 2;
  } else {
    ch = sw / dAspect;
    sy = (sh - ch) / 2;
  }
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, dw, dh);
}

function resizeCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number, dpr: number) {
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  return { w, h };
}

function drawReticle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  locked: boolean,
  at?: { x: number; y: number },
) {
  const cx = at?.x ?? w / 2;
  const cy = at?.y ?? h * 0.6;
  const r = Math.min(w, h) * 0.09;
  ctx.strokeStyle = locked ? "rgba(197, 212, 222, 0.9)" : "rgba(197, 212, 222, 0.45)";
  ctx.lineWidth = Math.max(1.5, h * 0.002);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.35, cy);
  ctx.lineTo(cx - r * 0.55, cy);
  ctx.moveTo(cx + r * 0.55, cy);
  ctx.lineTo(cx + r * 1.35, cy);
  ctx.moveTo(cx, cy - r * 1.35);
  ctx.lineTo(cx, cy - r * 0.55);
  ctx.moveTo(cx, cy + r * 0.55);
  ctx.lineTo(cx, cy + r * 1.35);
  ctx.stroke();
}

function drawBracket(ctx: CanvasRenderingContext2D, b: BBox, color: string) {
  const l = Math.max(6, Math.min(b.w, b.h) * 0.22);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + l);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(b.x + l, b.y);
  ctx.moveTo(b.x + b.w - l, b.y);
  ctx.lineTo(b.x + b.w, b.y);
  ctx.lineTo(b.x + b.w, b.y + l);
  ctx.moveTo(b.x + b.w, b.y + b.h - l);
  ctx.lineTo(b.x + b.w, b.y + b.h);
  ctx.lineTo(b.x + b.w - l, b.y + b.h);
  ctx.moveTo(b.x + l, b.y + b.h);
  ctx.lineTo(b.x, b.y + b.h);
  ctx.lineTo(b.x, b.y + b.h - l);
  ctx.stroke();
}

function drawLockCaption(ctx: CanvasRenderingContext2D, b: BBox, title: string, h: number) {
  const size = Math.max(12, Math.min(20, h * 0.018));
  ctx.font = `600 ${size}px "Barlow Condensed", sans-serif`;
  ctx.textBaseline = "top";
  const padX = 7;
  const padY = 4;
  const tw = ctx.measureText(title).width;
  const boxW = tw + padX * 2;
  const boxH = size + padY * 2;
  const x = Math.max(4, Math.min(b.x, ctx.canvas.width - boxW - 4));
  const y = Math.max(4, b.y - boxH - 4);
  ctx.fillStyle = "rgba(8, 9, 11, 0.82)";
  ctx.fillRect(x, y, boxW, boxH);
  ctx.fillStyle = "rgba(236, 239, 242, 0.95)";
  ctx.fillText(title, x + padX, y + padY);
}

export function useVeloxEngine(refs: EngineRefs) {
  const refsRef = useRef(refs);
  refsRef.current = refs;

  const cameraOn = useVelox((s) => s.cameraOn);
  const facing = useVelox((s) => s.settings.cameraFacing);

  useEffect(() => {
    useVelox.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!cameraOn) {
      const video = refsRef.current.videoRef.current;
      const stream = video?.srcObject;
      if (stream instanceof MediaStream) {
        for (const t of stream.getTracks()) t.stop();
        if (video) video.srcObject = null;
      }
      useVelox.setState({ cameraReady: false });
      return;
    }

    let cancelled = false;
    const video = refsRef.current.videoRef.current;
    if (!video) return;

    (async () => {
      useVelox.setState({ cameraError: null });
      try {
        await requestMotionPermission();
        const stream = await openCamera(facing);
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        await video.play();
        useVelox.setState({ cameraReady: true, cameraError: null });
      } catch (err) {
        useVelox.setState({
          cameraReady: false,
          cameraError: cameraErrorMessage(err),
          cameraOn: false,
        });
      }
    })();

    return () => {
      cancelled = true;
      const stream = video.srcObject;
      if (stream instanceof MediaStream) {
        for (const t of stream.getTracks()) t.stop();
        video.srcObject = null;
      }
    };
  }, [cameraOn, facing]);

  useEffect(() => {
    const range = new RangeTracker();
    const flow = new FlowTracker(ANALYSIS_W, ANALYSIS_H);
    let road: RoadState = { t: 0, distance: 0, speedMps: 0, heading: 18 };
    let cars: SimCar[] = seedCars();
    let prevGray: Uint8Array | null = null;
    let lastLockId: string | null = null;
    let lastBox: BBox | null = null;
    let lastDist = 0;
    let held: LockedTarget | null = null;
    let holdUntil = 0;
    let displayMps = 0;
    let raf = 0;
    let last = performance.now();
    let lastHistory = 0;

    const analysis = refsRef.current.analysisRef.current;
    if (analysis) {
      analysis.width = ANALYSIS_W;
      analysis.height = ANALYSIS_H;
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.008, (now - last) / 1000));
      last = now;
      const store = useVelox.getState();
      const { settings, cameraReady } = store;
      const { videoRef, simRef, overlayRef, analysisRef } = refsRef.current;
      const video = videoRef.current;
      const sim = simRef.current;
      const overlay = overlayRef.current;
      const aCanvas = analysisRef.current;
      const aCtx = aCanvas?.getContext("2d", { willReadFrequently: true });

      const useCamera = store.cameraOn && cameraReady && video != null && video.readyState >= 2;
      const channel: "demo" | "camera" = useCamera ? "camera" : "demo";

      let lock: LockedTarget | null = null;
      const boxes: { id: string; bbox: BBox }[] = [];
      let canvasW = 1;
      let canvasH = 1;

      if (sim) {
        const parent = sim.parentElement;
        const cssW = parent?.clientWidth || window.innerWidth;
        const cssH = parent?.clientHeight || window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const { w, h } = resizeCanvas(sim, cssW, cssH, dpr);
        canvasW = w;
        canvasH = h;
        const sCtx = sim.getContext("2d");
        if (sCtx) {
          if (useCamera) {
            sCtx.clearRect(0, 0, w, h);
          } else {
            road = tickRoad(road, dt, true);
            cars = tickCars(cars, dt);
            const hits = drawRoad(sCtx, w, h, road, true, cars);
            for (const t of hits) {
              boxes.push({ id: t.id, bbox: t.bbox });
            }
            const center = { x: w / 2, y: h * 0.6 };
            const ranked = [...hits].sort((a, b) => a.distanceM - b.distanceM);
            let best = ranked.find((t) => {
              const cx = t.bbox.x + t.bbox.w / 2;
              const cy = t.bbox.y + t.bbox.h / 2;
              return Math.abs(cx - center.x) < w * 0.4 && Math.abs(cy - center.y) < h * 0.38;
            });
            if (!best) best = ranked[0];
            if (lastLockId) {
              const sticky = hits.find((t) => t.id === lastLockId);
              const jumped = sticky != null && sticky.distanceM > lastDist + 14;
              if (sticky && !jumped && sticky.bbox.h > 8) best = sticky;
            }
            if (best) {
              lock = {
                id: best.id,
                bbox: best.bbox,
                speedMps: best.speedMps,
                distanceM: best.distanceM,
                confidence: 0.92,
                fleetId: best.fleetId,
              };
            }
          }
        }
        if (overlay) resizeCanvas(overlay, cssW, cssH, dpr);
      }

      if (useCamera && aCtx && aCanvas && video) {
        drawCover(aCtx, video, video.videoWidth, video.videoHeight, ANALYSIS_W, ANALYSIS_H);
        const img = aCtx.getImageData(0, 0, ANALYSIS_W, ANALYSIS_H);
        const gray = new Uint8Array(ANALYSIS_W * ANALYSIS_H);
        rgbaToGray(img.data, gray);
        if (prevGray) {
          const found = findMovingRegions(prevGray, gray, ANALYSIS_W, ANALYSIS_H);
          const fr = flow.push(img, dt);
          const sx = canvasW / ANALYSIS_W;
          const sy = canvasH / ANALYSIS_H;
          const mapped = found.map((b, i) => ({
            id: `m${i}`,
            bbox: { x: b.x * sx, y: b.y * sy, w: b.w * sx, h: b.h * sy },
            score: b.score,
            raw: b,
          }));
          for (const m of mapped) boxes.push({ id: m.id, bbox: m.bbox });
          const chosen = pickLock(
            found,
            ANALYSIS_W,
            ANALYSIS_H,
            lastLockId,
            lastBox
              ? {
                  x: lastBox.x / sx,
                  y: lastBox.y / sy,
                  w: lastBox.w / sx,
                  h: lastBox.h / sy,
                }
              : null,
          );
          if (chosen) {
            const bbox = {
              x: chosen.x * sx,
              y: chosen.y * sy,
              w: chosen.w * sx,
              h: chosen.h * sy,
            };
            const distGuess =
              (settings.assumedWidthM * (canvasW / 2 / Math.tan(HFOV / 2))) /
              Math.max(8, bbox.w);
            const flowV = flowSpeedMps(
              fr.vectors,
              chosen,
              ANALYSIS_W,
              distGuess,
              dt,
              HFOV,
            );
            range.push(
              bbox,
              canvasW,
              settings.assumedWidthM,
              settings.sensitivity,
              now,
              flowV.speedMps,
              flowV.confidence,
            );
            lock = {
              id: "live",
              bbox,
              speedMps: range.speedMps,
              distanceM: range.distanceM,
              confidence: range.confidence,
              fleetId: null,
            };
            held = lock;
            holdUntil = now + 380;
          } else if (held && now < holdUntil) {
            lock = held;
          } else {
            range.reset();
            held = null;
          }
        }
        prevGray = gray;
      } else {
        prevGray = null;
        held = null;
        flow.reset();
      }

      lastLockId = lock?.id ?? null;
      lastBox = lock?.bbox ?? null;
      lastDist = lock?.distanceM ?? lastDist;

      const target = lock?.speedMps ?? 0;
      displayMps = displayMps * 0.72 + target * 0.28;
      if (!lock) displayMps *= 0.9;
      if (displayMps < 0.2) displayMps = 0;

      let history = store.history;
      if (now - lastHistory > 140) {
        history = history.length >= HISTORY_LEN ? history.slice(1) : history.slice();
        history.push(displayMps);
        lastHistory = now;
      }

      if (overlay) {
        const oCtx = overlay.getContext("2d");
        if (oCtx) {
          oCtx.clearRect(0, 0, overlay.width, overlay.height);
          if (settings.showBoxes) {
            for (const b of boxes) {
              oCtx.strokeStyle = "rgba(197, 212, 222, 0.28)";
              oCtx.lineWidth = 1;
              oCtx.strokeRect(b.bbox.x, b.bbox.y, b.bbox.w, b.bbox.h);
            }
          }
          if (lock) {
            drawBracket(oCtx, lock.bbox, "rgba(197, 212, 222, 0.95)");
            const ident = store.identification;
            const spec = lock.fleetId ? fleetById(lock.fleetId) : undefined;
            if (!ident && spec) {
              drawLockCaption(oCtx, lock.bbox, `${spec.make} ${spec.model}`, overlay.height);
            }
          }
          const aim = lock
            ? { x: lock.bbox.x + lock.bbox.w / 2, y: lock.bbox.y + lock.bbox.h / 2 }
            : undefined;
          drawReticle(oCtx, overlay.width, overlay.height, !!lock, aim);
        }
      }

      useVelox.setState({
        speedMps: displayMps,
        instantMps: target,
        history,
        activeChannel: channel,
        lock,
        boxes,
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export async function enableCamera() {
  useVelox.setState({
    cameraOn: true,
    cameraError: null,
    identification: null,
    identifiedLockId: null,
    identifyError: null,
    identifyStatus: "idle",
  });
}

export function disableCamera() {
  useVelox.setState({ cameraOn: false, cameraReady: false });
}

export function captureLockJpeg(
  source: HTMLVideoElement | HTMLCanvasElement,
  bbox: BBox,
  frameW: number,
  frameH: number,
): string | null {
  const srcW = "videoWidth" in source ? source.videoWidth || frameW : source.width;
  const srcH = "videoHeight" in source ? source.videoHeight || frameH : source.height;
  if (!srcW || !srcH) return null;
  const nx = bbox.x / frameW;
  const ny = bbox.y / frameH;
  const nw = bbox.w / frameW;
  const nh = bbox.h / frameH;
  const pad = 0.08;
  const sx = Math.max(0, (nx - pad) * srcW);
  const sy = Math.max(0, (ny - pad) * srcH);
  const sw = Math.min(srcW - sx, (nw + pad * 2) * srcW);
  const sh = Math.min(srcH - sy, (nh + pad * 2) * srcH);
  const out = document.createElement("canvas");
  out.width = 320;
  out.height = Math.max(180, Math.round(320 * (sh / sw)));
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, out.width, out.height);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  redactPlatesFromImageData(img, ctx);
  return out.toDataURL("image/jpeg", 0.72);
}
