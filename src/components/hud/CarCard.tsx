import { useState } from "react";
import { Share2 } from "lucide-react";
import type { LockedTarget, VehicleId } from "@/lib/speed/types";
import { formatDistance, formatSpeed, speedUnit } from "@/lib/speed/format";
import { gammaById, inferGamma, matchCatalog } from "@/lib/speed/catalog";
import { shareFicha } from "@/lib/speed/share";
import { useVelox } from "@/lib/speed/store";
import { Button } from "@/components/ui/button";

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
  const [shareNote, setShareNote] = useState<string | null>(null);
  const hit = id ? matchCatalog(id.make, id.model) : undefined;
  const gamma = id
    ? gammaById(hit?.gamma ?? inferGamma(id.make, id.model, id.klass))
    : null;

  if (!lock && !id) return null;

  return (
    <div
      className="mt-1 rounded-md border border-line/70 bg-bg/40 px-3 py-2"
      data-testid="car-card"
      data-has-ficha={id ? "1" : "0"}
    >
      {id ? (
        <>
          <p className="hud-kicker text-faint">
            Ficha
            {gamma ? ` · ${gamma.name}` : ""}
          </p>
          <p className="font-condensed mt-0.5 text-lg leading-none font-semibold tracking-wide text-fg sm:text-xl">
            {id.make} {id.model}
          </p>
          <p className="mt-1 text-xs text-muted">
            {id.year}
            {id.color ? ` · ${id.color}` : ""}
            {gamma ? ` · ${gamma.rarity}` : ""}
            {lock ? ` · ${formatSpeed(lock.speedMps, units)} ${speedUnit(units)}` : ""}
          </p>
          <p className="mt-1.5 text-sm leading-snug text-pretty text-fg">{id.description}</p>
          <p className="mt-1.5 text-sm leading-snug text-muted">
            <span className="text-hud">Dato · </span>
            {id.funFact}
          </p>
          <Button
            variant="hud"
            size="sm"
            className="mt-2"
            onClick={() => {
              void shareFicha(
                id,
                lock ? `${formatSpeed(lock.speedMps, units)} ${speedUnit(units)}` : undefined,
              ).then((r) => setShareNote(r === "copied" ? "Copiado" : r === "shared" ? "Enviado" : null));
            }}
          >
            <Share2 />
            {shareNote ?? "Compartir"}
          </Button>
        </>
      ) : status === "loading" ? (
        <p className="text-sm text-muted">Identificando el vehículo…</p>
      ) : err ? (
        <p className="text-sm text-danger">{err}</p>
      ) : lock ? (
        <p className="text-sm text-muted">
          Blanco a {formatDistance(lock.distanceM, units).value}{" "}
          {formatDistance(lock.distanceM, units).unit}. La ficha se arma sola al
          mantener el auto en el retículo.
        </p>
      ) : null}
    </div>
  );
}
