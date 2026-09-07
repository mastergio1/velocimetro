import type { CollectionEntry } from "./catalog";
import type { VehicleId } from "./types";

export function fichaText(v: VehicleId, extra?: string): string {
  const lines = [
    `VELOX · ${v.make} ${v.model}`,
    v.year || v.color ? [v.year, v.color].filter(Boolean).join(" · ") : "",
    v.description,
    v.funFact ? `Dato · ${v.funFact}` : "",
    extra ?? "",
  ].filter(Boolean);
  return lines.join("\n");
}

export async function shareFicha(v: VehicleId, extra?: string): Promise<"shared" | "copied" | "cancel"> {
  const text = fichaText(v, extra);
  const title = `VELOX · ${v.make} ${v.model}`;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancel";
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return "copied";
  }
  return "cancel";
}

export function downloadCatalog(entries: CollectionEntry[]) {
  const payload = {
    app: "VELOX",
    at: new Date().toISOString(),
    count: entries.length,
    cars: entries.map((e) => ({
      make: e.make,
      model: e.model,
      year: e.year,
      color: e.color,
      gamma: e.gamma,
      description: e.description,
      funFact: e.funFact,
      sightings: e.sightings,
      lastSpeedKmh: e.lastSpeedKmh,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "velox-catalogo.json";
  a.click();
  URL.revokeObjectURL(url);
}
