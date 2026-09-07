import { createServerFn } from "@tanstack/react-start";
import type { VehicleId } from "./types";

const PROMPT = `Identifica CUALQUIER vehículo de la foto: auto, SUV, pickup, van, bus o coupé. Marcas de cualquier país (Europa, Japón, Corea, China, América, etc.). No te limites a marcas famosas. Si ves emblema o silueta, da la marca y el modelo más específico posible (ej. "BYD Song Plus", "Suzuki Swift", "Peugeot 208", "Chery Tiggo 2").
PRIVACIDAD: ignora patentes, PPU, matrículas y cualquier texto de placa. Nunca las transcribas ni las cites en description o funFact. Si hay una barra negra sobre la placa, es intencional.
Responde SOLO JSON válido, sin markdown:
{"make":"marca o unknown","model":"modelo","year":"año o generación","color":"color","klass":"sedan|hatch|suv|pickup|van|sport|super|hyper|classic","wheelbaseM":2.7,"description":"una frase breve en español, máximo 140 caracteres","funFact":"un dato curioso verdadero en español, máximo 180 caracteres"}
Si no hay un vehículo claro, usa make "unknown".`;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 60;
const recentCalls: number[] = [];

function rateOk(): boolean {
  const now = Date.now();
  while (recentCalls.length && now - recentCalls[0]! > RATE_WINDOW_MS) recentCalls.shift();
  if (recentCalls.length >= RATE_MAX) return false;
  recentCalls.push(now);
  return true;
}

export function clip(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .slice(0, max);
}

export function normalizeImage(image: string): string | null {
  const s = image.trim();
  if (s.length < 32 || s.length > 900_000) return null;
  if (/^(https?|file|javascript|blob):/i.test(s)) return null;
  if (/^data:/i.test(s)) {
    const m = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i.exec(s);
    if (!m) return null;
    const mime = m[1]!.toLowerCase() === "jpg" ? "jpeg" : m[1]!.toLowerCase();
    return `data:image/${mime};base64,${m[2]!.replace(/\s/g, "")}`;
  }
  if (!/^[A-Za-z0-9+/=\s]+$/.test(s)) return null;
  return `data:image/jpeg;base64,${s.replace(/\s/g, "")}`;
}

export function extractJson(text: string): VehicleId | null {
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(trimmed.slice(start, end + 1)) as Partial<VehicleId>;
    if (!raw.make || raw.make === "unknown") return null;
    const wb = Number(raw.wheelbaseM);
    return {
      make: clip(raw.make, 40),
      model: clip(raw.model, 48),
      year: clip(raw.year, 16),
      color: clip(raw.color, 24),
      description: clip(raw.description, 180),
      funFact: clip(raw.funFact, 220),
      klass: raw.klass ? clip(raw.klass, 24) : undefined,
      wheelbaseM: Number.isFinite(wb) && wb >= 1.8 && wb <= 4.6 ? wb : undefined,
    };
  } catch {
    return null;
  }
}

export const identifyVehicle = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => {
    if (!input || typeof input.image !== "string") throw new Error("Imagen requerida");
    const image = normalizeImage(input.image);
    if (!image) throw new Error("Imagen inválida");
    return { image };
  })
  .handler(async ({ data }): Promise<{ ok: true; id: VehicleId } | { ok: false; error: string }> => {
    if (!rateOk()) {
      return { ok: false, error: "Demasiadas identificaciones. Prueba más tarde." };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "La identificación con IA no está disponible." };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 340,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: data.image } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `No se pudo identificar (${res.status}).` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const id = extractJson(text);
    if (!id) return { ok: false, error: "No reconocí un vehículo en el encuadre." };
    return { ok: true, id };
  });
