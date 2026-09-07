import type { LockedTarget, VehicleId } from "@/lib/speed/types";
import { formatDistance, formatSpeed, speedUnit } from "@/lib/speed/format";
import { useVelox } from "@/lib/speed/store";

export function CarCard({
  id,
  lock,
}: {
  id: VehicleId | null;
  lock: LockedTarget | null;
}) {
  const units = useVelox((s) => s.settings.units);
  const status = useVelox((s) => s.identifyStatus);
  const err = useVelox((s) => s.identifyError);

  if (!lock && !id) return null;

  return (
    <div
      className="rounded-lg border border-line bg-surface/80 px-3 py-2.5"
      data-testid="car-card"
      data-has-ficha={id ? "1" : "0"}
    >
      {id ? (
        <>
          <p className="hud-kicker text-faint">Ficha</p>
          <p className="font-condensed mt-0.5 text-lg leading-none font-semibold tracking-wide text-fg sm:text-xl">
            {id.make} {id.model}
          </p>
          <p className="mt-1 text-xs text-muted">
            {id.year}
            {id.color ? ` · ${id.color}` : ""}
            {lock ? ` · ${formatSpeed(lock.speedMps, units)} ${speedUnit(units)}` : ""}
          </p>
          <p className="mt-1.5 text-sm leading-snug text-pretty text-fg">{id.description}</p>
          <p className="mt-1.5 text-sm leading-snug text-muted">
            <span className="text-hud">Dato · </span>
            {id.funFact}
          </p>
        </>
      ) : status === "loading" ? (
        <p className="text-sm text-muted">Identificando el vehículo…</p>
      ) : err ? (
        <p className="text-sm text-danger">{err}</p>
      ) : lock ? (
        <p className="text-sm text-muted">
          Blanco a {formatDistance(lock.distanceM, units).value}{" "}
          {formatDistance(lock.distanceM, units).unit}. Pulsa Identificar para la ficha IA.
        </p>
      ) : null}
    </div>
  );
}
