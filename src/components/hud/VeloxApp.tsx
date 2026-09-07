import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, LayoutGrid, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalogGauge } from "@/components/hud/AnalogGauge";
import { CarCard } from "@/components/hud/CarCard";
import { MemoryDrawer } from "@/components/hud/MemoryDrawer";
import { SettingsDrawer } from "@/components/hud/SettingsDrawer";
import { Sparkline } from "@/components/hud/Sparkline";
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
  const history = useVelox((s) => s.history);
  const cameraOn = useVelox((s) => s.cameraOn);
  const cameraReady = useVelox((s) => s.cameraReady);
  const cameraError = useVelox((s) => s.cameraError);
  const channel = useVelox((s) => s.activeChannel);
  const lock = useVelox((s) => s.lock);
  const identification = useVelox((s) => s.identification);
  const identifiedLockId = useVelox((s) => s.identifiedLockId);
  const identifyStatus = useVelox((s) => s.identifyStatus);
  const remember = useVelox((s) => s.remember);
  const unlocks = useVelox((s) => s.unlocks);
  const wilds = useVelox((s) => s.wilds);

  const [clock, setClock] = useState("--:--");
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
        identifyError: "Llegaste al límite de fichas IA en esta sesión.",
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

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-bg/40 via-transparent to-bg/75" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-bg/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-bg via-bg/65 to-transparent" />

      <div className="hud-shell relative z-10 flex h-full flex-col">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-condensed text-2xl leading-none font-semibold tracking-[0.22em] text-fg">
              VELOX
            </p>
            <p className="mt-1 text-xs tracking-[0.14em] text-muted uppercase">
              Pistola de velocidad
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-sm tabular-nums text-hud">{clock}</p>
            <span className="hud-kicker rounded-sm border border-line bg-surface/70 px-2 py-0.5 text-hud">
              {lock ? "BLOQUEADO" : "BUSCANDO"}
            </span>
            <Link
              to="/catalogo"
              data-testid="catalog-link"
              className="hud-kicker inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-line/80 bg-bg/55 px-2 py-1 text-hud"
            >
              <LayoutGrid className="size-3.5" />
              Catálogo {unlocks.length + wilds.length}
            </Link>
          </div>
        </header>

        <p className="mt-2 text-center text-[11px] leading-snug text-muted sm:text-xs">
          {channel === "demo"
            ? "Demo de calle: el retículo bloquea un auto, lee su velocidad y arma la ficha. Activa la cámara para medir de verdad."
            : lock
              ? "Mantén el auto en el centro. Identificar genera marca, modelo, descripción y un dato con IA."
              : "Apunta la cámara a un auto en movimiento y espera el bloqueo."}
        </p>

        {cameraError ? (
          <p className="mt-2 rounded-md border border-danger/40 bg-surface/80 px-3 py-2 text-xs text-danger">
            {cameraError}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto">
          <div className="mx-auto flex w-full max-w-lg flex-col items-center">
            <p
              className={cn(
                "font-condensed hud-shadow text-speed leading-none font-bold tabular-nums",
                over ? "text-danger" : "text-fg",
              )}
            >
              {formatSpeed(speedMps, units)}
            </p>
            <p className="mt-0.5 text-sm tracking-[0.28em] text-muted uppercase">{unit}</p>
            <p className="mt-0.5 text-xs tabular-nums text-muted">
              {dist ? `Dist ${dist.value} ${dist.unit}` : "Sin blanco"}
              {lock ? ` · lock ${Math.round(lock.confidence * 100)}%` : ""}
            </p>
            <div className={cn("-mt-2 w-full", identification ? "max-w-sm" : "max-w-md")}>
              <AnalogGauge speedMps={speedMps} units={units} limitKmh={limitKmh} />
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg space-y-2">
            {identification ? null : <Sparkline history={history} units={units} />}
            <CarCard id={identification} lock={lock} />
          </div>

          <div className="mx-auto mt-3 flex w-full max-w-lg items-center gap-2 pb-1">
            <MemoryDrawer />
            <Button
              variant={cameraOn ? "default" : "hud"}
              className="min-h-12 flex-1"
              onClick={() => (cameraOn ? disableCamera() : void enableCamera())}
            >
              <Camera />
              {cameraOn ? "Cámara activa" : "Activar cámara"}
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
      </div>
    </main>
  );
}
