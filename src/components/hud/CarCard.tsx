import { useState } from "react";
import { ChevronDown, Share2 } from "lucide-react";
import type { LockedTarget, VehicleId } from "@/lib/speed/types";
import { formatSpeed, speedUnit } from "@/lib/speed/format";
import { gammaById, inferGamma, matchCatalog } from "@/lib/speed/catalog";
import { shareFicha } from "@/lib/speed/share";
import { useVelox } from "@/lib/speed/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const hit = id ? matchCatalog(id.make, id.model) : undefined;
  const gamma = id
    ? gammaById(hit?.gamma ?? inferGamma(id.make, id.model, id.klass))
    : null;

  if (!id && status !== "loading" && !err) return null;

  if (!id) {
    return (
      <p className="px-1 py-1 text-center text-xs text-muted" data-testid="car-card" data-has-ficha="0">
        {status === "loading" ? "Identificando…" : err}
      </p>
    );
  }

  return (
    <div data-testid="car-card" data-has-ficha="1">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="hud-kicker text-hud">{gamma ? gamma.tag : "Ficha"}</span>
          <span className="font-condensed mt-0.5 block text-lg leading-none font-semibold text-fg">
            {id.make} {id.model}
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-muted">
            {id.year}
            {id.color ? ` · ${id.color}` : ""}
            {gamma ? ` · ${gamma.rarity}` : ""}
            {lock ? ` · ${formatSpeed(lock.speedMps, units)} ${speedUnit(units)}` : ""}
          </p>
          <p className="text-sm leading-snug text-pretty text-fg">{id.description}</p>
          <p className="text-sm leading-snug text-muted">
            <span className="text-hud">Dato · </span>
            {id.funFact}
          </p>
          <Button
            variant="hud"
            size="sm"
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
        </div>
      ) : null}
    </div>
  );
}
