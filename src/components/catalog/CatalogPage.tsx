import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crosshair, RotateCcw } from "lucide-react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { CarSilhouette } from "@/components/catalog/CarSilhouette";
import {
  CATALOG,
  GAMMAS,
  gammaById,
  type CatalogCar,
  type GammaId,
  type WildEntry,
} from "@/lib/speed/catalog";
import { useVelox } from "@/lib/speed/store";
import { cn } from "@/lib/utils";

type Filter = "all" | GammaId;
type Tile = (CatalogCar | WildEntry) & { unlocked: boolean; wild?: boolean };

const GAMMA_TONE: Record<GammaId, string> = {
  calle: "text-faint",
  sport: "text-muted",
  selecta: "text-hud",
  elite: "text-fg",
  mito: "text-warn",
};

function GammaPips({ rank, className }: { rank: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 w-2.5 rounded-full",
            i < rank ? "bg-current" : "bg-line",
          )}
        />
      ))}
    </span>
  );
}

export function CatalogPage() {
  const hydrate = useVelox((s) => s.hydrate);
  const unlocks = useVelox((s) => s.unlocks);
  const wilds = useVelox((s) => s.wilds);
  const lastUnlockId = useVelox((s) => s.lastUnlockId);
  const resetCatalog = useVelox((s) => s.resetCatalog);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const unlockedSet = useMemo(() => new Set(unlocks), [unlocks]);

  const tiles: Tile[] = useMemo(() => {
    const base: Tile[] = CATALOG.map((car) => ({
      ...car,
      unlocked: unlockedSet.has(car.id),
    }));
    const extras: Tile[] = wilds.map((w) => ({ ...w, unlocked: true, wild: true }));
    return [...base, ...extras];
  }, [unlockedSet, wilds]);

  const visible = filter === "all" ? tiles : tiles.filter((t) => t.gamma === filter);
  const groups = (filter === "all" ? GAMMAS : GAMMAS.filter((g) => g.id === filter)).map(
    (g) => ({
      gamma: g,
      items: visible.filter((t) => t.gamma === g.id),
    }),
  );

  const unlockedCount = CATALOG.filter((c) => unlockedSet.has(c.id)).length + wilds.length;
  const total = CATALOG.length + wilds.length;
  const openTile = openId ? tiles.find((t) => t.id === openId && t.unlocked) : null;

  return (
    <main className="hud-shell min-h-dvh bg-bg text-fg">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-condensed text-2xl leading-none font-semibold tracking-[0.22em] text-fg">
            VELOX
          </p>
          <p className="mt-1 text-xs tracking-[0.14em] text-muted uppercase">Catálogo</p>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line/80 bg-bg/55 px-3 text-sm text-hud"
        >
          <Crosshair className="size-4" />
          Pistola
        </Link>
      </header>

      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
        Cada auto que analizas se desbloquea. Las gammas son las rarezas: Calle, Sport,
        Selecta, Élite y Mito.
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-condensed text-3xl leading-none font-semibold tabular-nums text-fg">
            {unlockedCount}
            <span className="text-xl text-muted">/{total}</span>
          </p>
          <p className="mt-1 hud-kicker text-faint">Registrados</p>
        </div>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-hud"
            style={{ width: `${total ? Math.round((unlockedCount / total) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div
        className="mt-5 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Gammas"
      >
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Todas"
          hint={`${unlockedCount}/${total}`}
        />
        {GAMMAS.map((g) => {
          const have =
            CATALOG.filter((c) => c.gamma === g.id && unlockedSet.has(c.id)).length +
            wilds.filter((w) => w.gamma === g.id).length;
          const max = CATALOG.filter((c) => c.gamma === g.id).length;
          return (
            <FilterChip
              key={g.id}
              active={filter === g.id}
              onClick={() => setFilter(g.id)}
              label={g.name.replace("Gamma ", "")}
              hint={`${g.rarity} · ${have}/${max}`}
              tone={GAMMA_TONE[g.id]}
            />
          );
        })}
      </div>

      {unlockedCount === 0 ? (
        <div className="mt-10 rounded-lg border border-line bg-surface px-4 py-8 text-center">
          <CarSilhouette className="mx-auto h-10 w-28 text-faint" />
          <p className="mt-4 font-condensed text-xl font-semibold text-fg">Sin fichas aún</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Abre la pistola, bloquea un auto y analízalo. El catálogo se va llenando por
            gamma.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">Ir a la pistola</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-8 pb-10">
          {groups.map(({ gamma, items }) =>
            items.length === 0 ? null : (
              <section key={gamma.id}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <div>
                    <p className={cn("font-condensed text-xl font-semibold", GAMMA_TONE[gamma.id])}>
                      {gamma.name}
                    </p>
                    <p className="mt-0.5 text-xs tracking-[0.12em] text-muted uppercase">
                      {gamma.rarity} · {gamma.blurb}
                    </p>
                  </div>
                  <GammaPips rank={gamma.rank} className={GAMMA_TONE[gamma.id]} />
                </div>
                <ul className="grid grid-cols-2 gap-2 min-[720px]:grid-cols-3">
                  {items.map((tile) => (
                    <li key={tile.id}>
                      <CarTile
                        tile={tile}
                        fresh={tile.id === lastUnlockId}
                        onOpen={() => tile.unlocked && setOpenId(tile.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}

      {unlockedCount > 0 ? (
        <div className="pb-6">
          <Button variant="ghost" className="w-full" onClick={() => resetCatalog()}>
            <RotateCcw />
            Reiniciar catálogo
          </Button>
        </div>
      ) : null}

      <Drawer.Root open={!!openTile} onOpenChange={(v) => !v && setOpenId(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-bg/70" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl border border-line bg-surface settings-sheet">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
            {openTile ? (
              <div className="px-5 pt-4 pb-6">
                <p className={cn("hud-kicker", GAMMA_TONE[openTile.gamma])}>
                  {gammaById(openTile.gamma).name}
                  {openTile.id.startsWith("wild-") ? " · Hallazgo" : ""}
                </p>
                <Drawer.Title className="font-condensed mt-1 text-2xl font-semibold tracking-wide text-fg">
                  {openTile.make} {openTile.model}
                </Drawer.Title>
                <Drawer.Description className="mt-1 text-sm text-muted">
                  {openTile.year}
                  {openTile.color ? ` · ${openTile.color}` : ""} ·{" "}
                  {gammaById(openTile.gamma).rarity}
                </Drawer.Description>
                <CarSilhouette className="mt-4 h-12 w-full text-hud" />
                <p className="mt-4 text-sm leading-relaxed text-fg">{openTile.description}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  <span className="text-hud">Dato · </span>
                  {openTile.funFact}
                </p>
                <Button className="mt-6 w-full" onClick={() => setOpenId(null)}>
                  Listo
                </Button>
              </div>
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  hint,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  tone?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-md border px-3 py-1.5 text-left transition-[opacity,background-color,border-color] duration-200",
        active ? "border-fg bg-fg text-bg" : "border-line bg-surface text-fg",
      )}
    >
      <span className={cn("block text-sm font-medium", !active && tone)}>{label}</span>
      <span className={cn("block text-[11px]", active ? "text-bg/70" : "text-muted")}>
        {hint}
      </span>
    </button>
  );
}

function CarTile({
  tile,
  fresh,
  onOpen,
}: {
  tile: Tile;
  fresh: boolean;
  onOpen: () => void;
}) {
  const gamma = gammaById(tile.gamma);
  if (!tile.unlocked) {
    return (
      <article className="flex min-h-36 flex-col justify-between rounded-lg border border-line bg-surface/70 px-3 py-3">
        <div className="flex items-center justify-between">
          <span className="hud-kicker text-faint">{gamma.tag}</span>
          <GammaPips rank={gamma.rank} className="text-faint" />
        </div>
        <CarSilhouette className="mx-auto h-8 w-24 text-line" />
        <p className="text-center text-xs tracking-[0.14em] text-faint uppercase">
          Sin registrar
        </p>
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="catalog-tile"
      className={cn(
        "flex min-h-36 w-full flex-col justify-between rounded-lg border bg-raised px-3 py-3 text-left",
        fresh ? "border-hud" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("hud-kicker", GAMMA_TONE[tile.gamma])}>
          {tile.id.startsWith("wild-") ? "Hallazgo" : gamma.tag}
        </span>
        {fresh ? <span className="hud-kicker text-hud">Nuevo</span> : null}
      </div>
      <CarSilhouette className={cn("mx-auto h-8 w-24", GAMMA_TONE[tile.gamma])} />
      <div>
        <p className="font-condensed text-lg leading-none font-semibold text-fg">
          {tile.make}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted">{tile.model}</p>
      </div>
    </button>
  );
}
