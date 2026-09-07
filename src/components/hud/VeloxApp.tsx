import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, LayoutGrid, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/hud/CarCard";
import { MemoryDrawer } from "@/components/hud/MemoryDrawer";
import { SettingsDrawer } from "@/components/hud/SettingsDrawer";
import { fleetById } from "@/lib/speed/catalog";
import {
  captureLockJpeg,
  disableCamera,
  enableCamera,
  aimAt,
  useVeloxEngine,
} from "@/lib/speed/engine";
import { identifyVehicle } from "@/lib/speed/identify";
import {
  formatClock,
  formatDistance,
  formatSpeed,
  limitInDisplay,
  speedUnit,
  toDisplaySpeed,
} from "@/lib/speed/format";
import { useVelox } from "@/lib/speed/store";
import { IDENTIFY_MAX } from "@/lib/speed/types";
import { cn } from "@/lib/utils";

export function VeloxApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const simRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const analysisRef = useRef<HTMLCanvasElement>(null);
  useVeloxEngine({ videoRef, simRef, overlayRef, analysisRef });

  const speedMps = useVelox((s) => s.speedMps);
  const units = useVelox((s) => s.settings.units);
  const limitKmh = useVelox((s) => s.settings.speedLimitKmh);
  const cameraOn = useVelox((s) => s.cameraOn);
  const cameraReady = useVelox((s) => s.cameraReady);
  const cameraError = useVelox((s) => s.cameraError);
  const channel = useVelox((s) => s.activeChannel);
  const lock = useVelox((s) => s.lock);
  const identification = useVelox((s) => s.identification);
  const identifiedLockId = useVelox((s) => s.identifiedLockId);
  const identifyStatus = useVelox((s) => s.identifyStatus);
  const identifyError = useVelox((s) => s.identifyError);
  const remember = useVelox((s) => s.remember);
  const collection = useVelox((s) => s.collection);
  const incognito = useVelox((s) => s.settings.incognito);
  const gunMode = useVelox((s) => s.settings.gunMode);
  const setSettings = useVelox((s) => s.setSettings);
  const shot = useVelox((s) => s.shot);

  const [clock, setClock] = useState("--:--");
  const [openingCam, setOpeningCam] = useState(false);
  useEffect(() => {
    setClock(formatClock(new Date()));
    const id = window.setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (cameraOn) return;
    if (!lock?.fleetId) return;
    const spec = fleetById(lock.fleetId);
    if (!spec) return;
    const live = useVelox.getState();
    if (live.identifiedLockId === lock.id && live.identification) return;
    live.remember(spec, lock.speedMps, lock.id);
  }, [lock?.id, lock?.fleetId, cameraOn]);

  useEffect(() => {
    if (!cameraOn) return;
    const live = useVelox.getState();
    if (live.identifiedLockId && live.identifiedLockId !== "live") {
      useVelox.setState({
        identification: null,
        identifiedLockId: null,
        identifyError: null,
        identifyStatus: "idle",
      });
    }
  }, [cameraOn]);

  const display = toDisplaySpeed(speedMps, units);
  const limit = limitInDisplay(limitKmh, units);
  const showingShot = !lock && shot != null;
  const over = display >= limit && speedMps > 1 && !showingShot;
  const near = !over && display >= limit * 0.85 && speedMps > 1 && !showingShot;
  const unit = speedUnit(units);
  const dist = lock ? formatDistance(lock.distanceM, units) : null;
  const needsAi = channel === "camera" && gunMode === "pista" && !!lock && identifiedLockId !== lock.id;

  async function onIdentify() {
    const live = useVelox.getState();
    const target = live.lock;
    if (!target || live.identifyStatus === "loading") return;

    if (target.fleetId) {
      const spec = fleetById(target.fleetId);
      if (spec) {
        remember(spec, target.speedMps, target.id);
        return;
      }
    }

    if (live.identifyCount >= IDENTIFY_MAX) {
      useVelox.setState({
        identifyStatus: "error",
        identifyError: "Pausa de fichas IA en esta sesión. La pistola sigue midiendo velocidad.",
      });
      return;
    }

    const source = live.cameraReady && videoRef.current ? videoRef.current : simRef.current;
    const frame = overlayRef.current;
    if (!source || !frame) return;
    const jpeg = captureLockJpeg(source, target.bbox, frame.width, frame.height);
    if (!jpeg) {
      useVelox.setState({ identifyStatus: "error", identifyError: "No pude capturar el encuadre." });
      return;
    }
    useVelox.setState({ identifyStatus: "loading", identifyError: null });
    try {
      const res = await identifyVehicle({ data: { image: jpeg } });
      const still = useVelox.getState().lock;
      if (res.ok) {
        useVelox.setState({ identifyCount: useVelox.getState().identifyCount + 1 });
        remember(res.id, still?.speedMps ?? target.speedMps, still?.id ?? target.id);
      } else {
        useVelox.setState({ identifyStatus: "error", identifyError: res.error });
      }
    } catch {
      useVelox.setState({
        identifyStatus: "error",
        identifyError: "No se pudo completar la identificación.",
      });
    }
  }

  const identifyRef = useRef(onIdentify);
  identifyRef.current = onIdentify;

  useEffect(() => {
    if (channel !== "camera") return;
    if (!lock) return;
    const live = useVelox.getState();
    if (live.identifiedLockId === lock.id) return;
    if (live.identifyStatus === "loading") return;
    if (live.identifyStatus === "error") {
      useVelox.setState({ identifyStatus: "idle", identifyError: null });
    }
  }, [channel, lock?.id]);

  useEffect(() => {
    if (channel !== "camera") return;
    if (gunMode === "disparo") return;
    if (!lock || identifiedLockId === lock.id) return;
    if (identifyStatus !== "idle") return;
    const timer = window.setTimeout(() => {
      void identifyRef.current();
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [channel, lock?.id, identifiedLockId, identifyStatus, gunMode]);

  return (
    <main
      className="relative isolate h-dvh min-h-[100svh] overflow-x-hidden bg-bg bg-cover bg-center text-fg"
      style={{ backgroundImage: "url(/demo/night.jpg)" }}
    >
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 size-full object-cover",
          cameraReady ? "opacity-100" : "opacity-0",
        )}
        poster="/demo/night.jpg"
        playsInline
        muted
      />
      <canvas ref={simRef} className="pointer-events-none absolute inset-0 size-full opacity-0" />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 size-full"
        onPointerDown={(e) => {
          if (!cameraOn) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          aimAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        }}
      />
      <canvas ref={analysisRef} className="hidden" width={320} height={180} />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-bg/35 via-transparent to-bg/25" />

      <div className="hud-shell pointer-events-none relative z-10 flex h-full flex-col">
        <header className="pointer-events-auto flex items-center justify-between gap-2">
          <p className="font-condensed text-lg leading-none font-semibold tracking-[0.28em] text-fg">
            VELOX
          </p>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="hud-chip tabular-nums text-hud">{clock}</span>
            <div className="flex overflow-hidden rounded-md border border-line">
              {(
                [
                  ["pista", "Pista"],
                  ["disparo", "Disparo"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "hud-chip rounded-none border-0 px-2 py-1",
                    gunMode === id ? "hud-chip-lock" : "text-muted",
                  )}
                  onClick={() => setSettings({ gunMode: id })}
                >
                  {label}
                </button>
              ))}
            </div>
            <span
              className={cn(
                "hud-chip",
                showingShot ? "hud-chip-lock" : lock ? "hud-chip-lock" : "text-muted",
              )}
            >
              {showingShot ? "CAPTURA" : lock ? "LOCK" : "SCAN"}
            </span>
            {over ? <span className="hud-chip hud-chip-fast">FAST</span> : null}
            {incognito ? <span className="hud-chip border-warn text-warn">PRIV</span> : null}
            <Link
              to="/catalogo"
              data-testid="catalog-link"
              className="hud-chip inline-flex min-h-8 items-center gap-1 text-hud"
            >
              <LayoutGrid className="size-3.5" />
              {collection.length}
            </Link>
          </div>
        </header>

        <div className="flex-1" />

        {cameraError ? (
          <p className="glass-dock mb-2 rounded-md px-3 py-2 text-xs text-danger">{cameraError}</p>
        ) : showingShot ? (
          <p className="mb-2 text-center text-xs text-hud">Listo — toca otro blanco.</p>
        ) : !lock ? (
          <p className="mb-2 text-center text-xs text-muted">
            {gunMode === "disparo"
              ? "Apunta el objeto. Al perderlo, congela la velocidad."
              : "Apunta un auto y tócalo para fijar el lock."}
          </p>
        ) : null}

        <div className="mx-auto w-full max-w-lg text-center">
          <p
            className={cn(
              "font-condensed led-speed text-speed leading-none font-bold",
              over
                ? "led-fast text-danger"
                : near
                  ? "text-warn"
                  : showingShot || lock
                    ? "led-lock text-hud"
                    : "text-hud",
            )}
          >
            {formatSpeed(speedMps, units)}
          </p>
          <p className={cn("hud-kicker mt-1", over ? "text-danger" : "text-hud")}>
            {showingShot && shot
              ? `CAPTURA · MEDIA ${formatSpeed(shot.meanMps, units)} ${unit}`
              : `${unit}${dist ? ` · DIST ${dist.value}${dist.unit}` : ""}${over ? " · EXCESO" : near ? " · LÍMITE" : ""}`}
          </p>
          {identification ? (
            <div className="glass-dock mt-3 rounded-md px-3 py-2 text-left">
              <CarCard id={identification} lock={lock} />
            </div>
          ) : identifyStatus === "loading" ? (
            <p className="hud-kicker mt-2 text-muted">Identificando…</p>
          ) : identifyStatus === "error" && identifyError ? (
            <p className="mt-2 text-xs text-danger">{identifyError}</p>
          ) : null}
        </div>

        <div className="pointer-events-auto mx-auto mt-2 flex w-full max-w-lg items-center gap-2">
          <MemoryDrawer />
          <Button
            variant={cameraOn ? "default" : "hud"}
            className="min-h-12 flex-1"
            disabled={openingCam}
            onClick={() => {
              if (cameraOn) {
                disableCamera();
                return;
              }
              setOpeningCam(true);
              void enableCamera(videoRef.current).finally(() => setOpeningCam(false));
            }}
          >
            <Camera />
            {openingCam ? "Abriendo…" : cameraOn ? "Cámara activa" : "Activar cámara"}
          </Button>
          <Button
            variant={needsAi ? "default" : "hud"}
            className="min-h-12"
            disabled={!lock || identifyStatus === "loading"}
            data-testid="identify"
            onClick={() => void onIdentify()}
          >
            <ScanSearch />
            {identifyStatus === "loading" ? "Leyendo…" : "Identificar"}
          </Button>
          <SettingsDrawer />
        </div>
      </div>
    </main>
  );
}
