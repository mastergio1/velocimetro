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
  const over = display >= limit && speedMps > 1;
  const unit = speedUnit(units);
  const dist = lock ? formatDistance(lock.distanceM, units) : null;
  const needsAi = channel === "camera" && !!lock && identifiedLockId !== lock.id;

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
    if (!lock || identifiedLockId === lock.id) return;
    if (identifyStatus !== "idle") return;
    const timer = window.setTimeout(() => {
      void identifyRef.current();
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [channel, lock?.id, identifiedLockId, identifyStatus]);

  return (
    <main className="relative isolate h-dvh overflow-x-hidden bg-bg text-fg">
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 size-full object-cover",
          cameraReady ? "opacity-100" : "opacity-0",
        )}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={simRef}
        className={cn(
          "absolute inset-0 size-full",
          cameraReady ? "opacity-0" : "opacity-100",
        )}
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 size-full"
      />
      <canvas ref={analysisRef} className="hidden" width={240} height={135} />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-bg/35 via-transparent to-bg/25" />

      <div className="hud-shell relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between gap-2">
          <p className="font-condensed text-lg leading-none font-semibold tracking-[0.28em] text-fg">
            VELOX
          </p>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="hud-chip tabular-nums text-hud">{clock}</span>
            <span className={cn("hud-chip", lock ? "border-hud text-hud" : "text-muted")}>
              {lock ? "LOCK" : "SCAN"}
            </span>
            {over ? <span className="hud-chip border-danger text-danger">FAST</span> : null}
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
        ) : !lock ? (
          <p className="mb-2 text-center text-xs text-muted">Apunta un auto. Quédate quieto.</p>
        ) : null}

        <div className="mx-auto w-full max-w-lg text-center">
          <p
            className={cn(
              "font-condensed led-speed text-speed leading-none font-bold",
              over ? "text-danger" : "text-hud",
            )}
          >
            {formatSpeed(speedMps, units)}
          </p>
          <p className="hud-kicker mt-1 text-hud">
            {unit}
            {dist ? ` · DIST ${dist.value}${dist.unit}` : ""}
            {over ? " · FAST" : ""}
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

        <div className="mx-auto mt-2 flex w-full max-w-lg items-center gap-2">
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
