import { createServerFn } from "@tanstack/react-start";
import type { VehicleId } from "./types";

const PROMPT = `Identifica CUALQUIER vehículo de la foto: auto, SUV, pickup, van, bus o coupé. Marcas de cualquier país (Europa, Japón, Corea, China, América, etc.). No te limites a marcas famosas. Si ves emblema o silueta, da la marca y el modelo más específico posible (ej. "BYD Song Plus", "Suzuki Swift", "Peugeot 208", "Chery Tiggo 2").
Responde SOLO JSON válido, sin markdown:
{"make":"marca o unknown","model":"modelo","year":"año o generación","color":"color","klass":"sedan|hatch|suv|pickup|van|sport|super|hyper|classic","description":"una frase breve en español, máximo 140 caracteres","funFact":"un dato curioso verdadero en español, máximo 180 caracteres"}
Si no hay un vehículo claro, usa make "unknown".`;

function extractJson(text: string): VehicleId | null {
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(trimmed.slice(start, end + 1)) as Partial<VehicleId>;
    if (!raw.make || raw.make === "unknown") return null;
    return {
      make: String(raw.make).slice(0, 40),
      model: String(raw.model ?? "").slice(0, 48),
      year: String(raw.year ?? "").slice(0, 16),
      color: String(raw.color ?? "").slice(0, 24),
      description: String(raw.description ?? "").slice(0, 180),
      funFact: String(raw.funFact ?? "").slice(0, 220),
      klass: raw.klass ? String(raw.klass).slice(0, 24) : undefined,
    };
  } catch {
    return null;
  }
}

export const identifyVehicle = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => {
    if (!input || typeof input.image !== "string") throw new Error("Imagen requerida");
    if (input.image.length > 900_000) throw new Error("Imagen demasiado grande");
    return input;
  })
  .handler(async ({ data }): Promise<{ ok: true; id: VehicleId } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "La identificación con IA no está disponible." };

    const image = data.image.startsWith("data:")
      ? data.image
      : `data:image/jpeg;base64,${data.image}`;

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
              { type: "image_url", image_url: { url: image } },
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
