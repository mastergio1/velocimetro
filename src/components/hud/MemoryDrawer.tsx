import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Drawer } from "vaul";
import { BookMarked, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVelox } from "@/lib/speed/store";

export function MemoryDrawer() {
  const memory = useVelox((s) => s.memory);
  const clearMemory = useVelox((s) => s.clearMemory);
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button
          variant="hud"
          size="icon"
          aria-label="Memoria de autos"
          data-testid="memory"
          className="relative"
        >
          <BookMarked />
          {memory.length > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-fg text-[10px] font-semibold text-bg">
              {memory.length > 9 ? "9+" : memory.length}
            </span>
          ) : null}
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-bg/70" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border border-line bg-surface settings-sheet">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
          <div className="settings-sheet overflow-y-auto px-5 pt-4">
            <Drawer.Title className="font-condensed text-2xl font-semibold tracking-wide text-fg">
              Memoria
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-muted">
              Últimos análisis en este teléfono. El catálogo guarda todos, sin tope de
              marcas.
            </Drawer.Description>

            <div className="mt-5 space-y-3">
              {memory.length === 0 ? (
                <p className="text-sm text-muted">
                  Aún no hay fichas. Apunta un auto y pulsa Identificar.
                </p>
              ) : (
                memory.map((m) => (
                  <article key={m.id} className="rounded-md border border-line bg-raised/70 px-3 py-3">
                    <p className="font-condensed text-lg leading-none font-semibold text-fg">
                      {m.make} {m.model}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {m.year} · {m.speedKmh} km/h ·{" "}
                      {new Date(m.at).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-2 text-sm text-fg">{m.description}</p>
                    <p className="mt-1 text-sm text-muted">{m.funFact}</p>
                  </article>
                ))
              )}
            </div>

            <div className="mt-6 space-y-2 pb-2">
              <Button asChild variant="ghost" className="w-full">
                <Link to="/catalogo" onClick={() => setOpen(false)}>
                  <LayoutGrid />
                  Abrir catálogo
                </Link>
              </Button>
              {memory.length > 0 ? (
                <Button variant="ghost" className="w-full" onClick={() => clearMemory()}>
                  Vaciar memoria
                </Button>
              ) : null}
              <Button variant="default" className="w-full" onClick={() => setOpen(false)}>
                Listo
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
