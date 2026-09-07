import {
  gammaById,
  inferGamma,
  matchCatalog,
  type CollectionEntry,
  type GammaId,
} from "./catalog";
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

function slug(v: VehicleId): string {
  return `${v.make}-${v.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

export function fichaCardUrl(v: VehicleId, extra?: string): string {
  return renderFichaCard(v, extra).toDataURL("image/png");
}

const CARD: Record<
  GammaId,
  { ink: string; glow: string; deep: string; label: string }
> = {
  calle: { ink: "#b8c4ce", glow: "rgba(184,196,206,0.22)", deep: "#14181e", label: "COMÚN" },
  sport: { ink: "#d08a4a", glow: "rgba(208,138,74,0.28)", deep: "#1a140e", label: "SPORT" },
  selecta: { ink: "#8f7ce0", glow: "rgba(143,124,224,0.28)", deep: "#14111e", label: "RARA" },
  elite: { ink: "#4d9dff", glow: "rgba(77,157,255,0.32)", deep: "#0d1522", label: "ÉPICA" },
  mito: { ink: "#e4b84a", glow: "rgba(228,184,74,0.34)", deep: "#1a1508", label: "MÍTICA" },
};

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
  const L = 48;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + L);
  ctx.lineTo(x, y);
  ctx.lineTo(x + L, y);
  ctx.moveTo(x + w - L, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + L);
  ctx.moveTo(x + w, y + h - L);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - L, y + h);
  ctx.moveTo(x + L, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - L);
  ctx.stroke();
}

export function renderFichaCard(v: VehicleId, extra?: string): HTMLCanvasElement {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const hit = matchCatalog(v.make, v.model);
  const gamma = gammaById(hit?.gamma ?? inferGamma(v.make, v.model, v.klass));
  const tone = CARD[gamma.id];

  ctx.fillStyle = tone.deep;
  ctx.fillRect(0, 0, w, h);
  const rad = ctx.createRadialGradient(w / 2, 180, 40, w / 2, 420, 820);
  rad.addColorStop(0, tone.glow);
  rad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);

  frame(ctx, 48, 48, w - 96, h - 96, tone.ink);

  ctx.fillStyle = tone.ink;
  ctx.font = "600 36px 'Barlow Condensed', sans-serif";
  ctx.letterSpacing = "0.28em";
  ctx.fillText("VELOX", 96, 140);

  ctx.fillStyle = tone.ink;
  ctx.font = "600 28px Barlow, sans-serif";
  ctx.letterSpacing = "0.18em";
  ctx.fillText(`${gamma.name.toUpperCase()} · ${tone.label}`, 96, 200);

  ctx.fillStyle = "#eceff2";
  ctx.font = "700 92px 'Barlow Condensed', sans-serif";
  ctx.letterSpacing = "0.02em";
  const name = `${v.make} ${v.model}`;
  const nameLines = wrap(ctx, name, w - 192);
  let y = 340;
  for (const ln of nameLines) {
    ctx.fillText(ln, 96, y);
    y += 100;
  }

  ctx.fillStyle = tone.ink;
  ctx.font = "500 32px Barlow, sans-serif";
  ctx.letterSpacing = "0.04em";
  const meta = [v.year, v.color, gamma.rarity, extra].filter(Boolean).join("  ·  ");
  ctx.fillText(meta, 96, y + 12);

  y += 80;
  ctx.fillStyle = "#eceff2";
  ctx.font = "400 36px Barlow, sans-serif";
  ctx.letterSpacing = "0";
  for (const ln of wrap(ctx, v.description, w - 192)) {
    ctx.fillText(ln, 96, y);
    y += 48;
  }

  y += 36;
  ctx.fillStyle = tone.ink;
  ctx.font = "600 28px Barlow, sans-serif";
  ctx.fillText("DATO", 96, y);
  y += 52;
  ctx.fillStyle = "#c5c0b5";
  ctx.font = "400 34px Barlow, sans-serif";
  for (const ln of wrap(ctx, v.funFact, w - 192)) {
    ctx.fillText(ln, 96, y);
    y += 46;
  }

  ctx.fillStyle = tone.ink;
  ctx.font = "500 24px 'Barlow Condensed', sans-serif";
  ctx.letterSpacing = "0.2em";
  ctx.fillText("PISTOLA DE VELOCIDAD", 96, h - 96);

  return canvas;
}

async function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareFicha(v: VehicleId, extra?: string): Promise<"shared" | "copied" | "saved" | "cancel"> {
  const title = `VELOX · ${v.make} ${v.model}`;
  const text = fichaText(v, extra);
  const fileName = `velox-${slug(v)}.png`;
  try {
    const blob = await canvasPng(renderFichaCard(v, extra));
    const file = new File([blob], fileName, { type: "image/png" });
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return "shared";
    }
    saveBlob(blob, fileName);
    return "saved";
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return "cancel";
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
  saveBlob(blob, "velox-catalogo.json");
}
