import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useVelox } from "@/lib/speed/store";
import type { CameraFacing, Units } from "@/lib/speed/types";

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-raised p-1">
      {options.map((opt) => {
        const on = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={
              on
                ? "h-9 rounded-sm bg-fg text-xs font-medium text-bg"
                : "h-9 rounded-sm text-xs font-medium text-muted hover:text-fg"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-fg">{label}</p>
        {hint ? <p className="text-xs text-muted tabular-nums">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsDrawer() {
  const settings = useVelox((s) => s.settings);
  const setSettings = useVelox((s) => s.setSettings);
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button variant="hud" size="icon" aria-label="Ajustes">
          <Settings2 />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-bg/70" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border border-line bg-surface settings-sheet">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
          <div className="settings-sheet overflow-y-auto px-5 pt-4">
            <Drawer.Title className="font-condensed text-2xl font-semibold tracking-wide text-fg">
              Ajustes
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-muted">
              El teléfono quieto mide mejor la velocidad del auto que se mueve. El dial
              abre hasta 500 km/h si el blanco lo pide.
            </Drawer.Description>

            <div className="mt-6 space-y-6">
              <Row label="Unidades">
                <Segment<Units>
                  value={settings.units}
                  onChange={(units) => setSettings({ units })}
                  options={[
                    { id: "kmh", label: "km/h" },
                    { id: "mph", label: "mph" },
                  ]}
                />
              </Row>

              <Row label="Cámara">
                <Segment<CameraFacing>
                  value={settings.cameraFacing}
                  onChange={(cameraFacing) => setSettings({ cameraFacing })}
                  options={[
                    { id: "environment", label: "Trasera" },
                    { id: "user", label: "Frontal" },
                  ]}
                />
              </Row>

              <Row
                label="Ancho típico del auto"
                hint={`${settings.assumedWidthM.toFixed(1)} m`}
              >
                <Slider
                  min={1.4}
                  max={2.2}
                  step={0.05}
                  value={[settings.assumedWidthM]}
                  onValueChange={(v) => setSettings({ assumedWidthM: v[0] ?? 1.8 })}
                  aria-label="Ancho típico del auto"
                />
              </Row>

              <Row
                label="Sensibilidad"
                hint={`${settings.sensitivity.toFixed(1)}×`}
              >
                <Slider
                  min={0.4}
                  max={2.4}
                  step={0.1}
                  value={[settings.sensitivity]}
                  onValueChange={(v) => setSettings({ sensitivity: v[0] ?? 1 })}
                  aria-label="Sensibilidad"
                />
              </Row>

              <Row
                label="Alerta de límite"
                hint={`${Math.round(settings.speedLimitKmh)} km/h`}
              >
                <Slider
                  min={20}
                  max={400}
                  step={5}
                  value={[settings.speedLimitKmh]}
                  onValueChange={(v) => setSettings({ speedLimitKmh: v[0] ?? 120 })}
                  aria-label="Límite de velocidad"
                />
              </Row>

              <div className="flex h-12 items-center justify-between gap-3 rounded-md border border-line bg-raised/70 px-3">
                <div>
                  <p className="text-sm font-medium text-fg">Guía de encuadre</p>
                </div>
                <Switch
                  checked={settings.showGuide}
                  onCheckedChange={(showGuide) => setSettings({ showGuide })}
                  aria-label="Mostrar guía de encuadre"
                />
              </div>

              <div className="flex h-12 items-center justify-between gap-3 rounded-md border border-line bg-raised/70 px-3">
                <div>
                  <p className="text-sm font-medium text-fg">60 fps</p>
                </div>
                <Switch
                  checked={settings.highFps}
                  onCheckedChange={(highFps) => setSettings({ highFps })}
                  aria-label="Alta tasa de fotogramas"
                />
              </div>

              <div className="flex h-12 items-center justify-between gap-3 rounded-md border border-line bg-raised/70 px-3">
                <div>
                  <p className="text-sm font-medium text-fg">Cajas de detección</p>
                </div>
                <Switch
                  checked={settings.showBoxes}
                  onCheckedChange={(showBoxes) => setSettings({ showBoxes })}
                  aria-label="Mostrar cajas de detección"
                />
              </div>

              <div className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-line bg-raised/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-fg">Modo incógnito</p>
                  <p className="text-xs text-muted">Mide e identifica, no guarda fichas.</p>
                </div>
                <Switch
                  checked={settings.incognito}
                  onCheckedChange={(incognito) => setSettings({ incognito })}
                  aria-label="Modo incógnito"
                />
              </div>

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
