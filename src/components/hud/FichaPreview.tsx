import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { fichaCardUrl, shareFicha } from "@/lib/speed/share";
import type { VehicleId } from "@/lib/speed/types";

export function FichaPreview({
  open,
  onOpenChange,
  vehicle,
  extra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleId | null;
  extra?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !vehicle) {
      setSrc(null);
      setNote(null);
      return;
    }
    setSrc(fichaCardUrl(vehicle, extra));
  }, [open, vehicle, extra]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-bg/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-60 rounded-t-xl border border-line bg-surface settings-sheet">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
          <div className="px-4 pt-4 pb-6">
            <Drawer.Title className="font-condensed text-xl font-semibold tracking-wide text-fg">
              Tarjeta
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-muted">
              Así se ve lo que vas a enviar.
            </Drawer.Description>
            {src ? (
              <img
                src={src}
                alt={vehicle ? `${vehicle.make} ${vehicle.model}` : "Ficha"}
                className="mt-4 mx-auto max-h-[55dvh] w-auto max-w-full rounded-md"
              />
            ) : null}
            <Button
              className="mt-4 w-full"
              disabled={!vehicle}
              onClick={() => {
                if (!vehicle) return;
                void shareFicha(vehicle, extra).then((r) =>
                  setNote(
                    r === "copied"
                      ? "Copiado"
                      : r === "shared"
                        ? "Enviado"
                        : r === "saved"
                          ? "Guardada"
                          : null,
                  ),
                );
              }}
            >
              <Share2 />
              {note ?? "Enviar o guardar"}
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
