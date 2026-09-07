/** Typical wheelbase in meters. Fallback by class if the model is unknown. */
const BY_NAME: Record<string, number> = {
  "toyota corolla": 2.7,
  "toyota yaris": 2.55,
  "toyota hilux": 3.09,
  "toyota rav4": 2.69,
  "honda civic": 2.74,
  "honda cr-v": 2.7,
  "mazda cx-5": 2.7,
  "mazda 3": 2.73,
  "nissan versa": 2.6,
  "nissan qashqai": 2.65,
  "hyundai tucson": 2.76,
  "kia sportage": 2.76,
  "volkswagen golf": 2.64,
  "volkswagen gol": 2.47,
  "chevrolet onix": 2.55,
  "ford ranger": 3.27,
  "ford f-150": 3.68,
  "suzuki swift": 2.45,
  "peugeot 208": 2.54,
  "byd song": 2.76,
  "chery tiggo": 2.63,
  "porsche 911": 2.45,
  "ferrari 488": 2.65,
};

const BY_KLASS: Record<string, number> = {
  hatch: 2.52,
  sedan: 2.7,
  suv: 2.7,
  pickup: 3.2,
  van: 3.0,
  sport: 2.55,
  super: 2.65,
  hyper: 2.7,
  classic: 2.55,
};

export function normName(make: string, model: string): string {
  return `${make} ${model}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function lookupWheelbase(make: string, model: string, klass?: string): number {
  const key = normName(make, model);
  if (BY_NAME[key]) return BY_NAME[key]!;
  for (const [name, wb] of Object.entries(BY_NAME)) {
    if (key.includes(name) || name.includes(key)) return wb;
  }
  if (klass && BY_KLASS[klass]) return BY_KLASS[klass]!;
  return 2.6;
}

/** Front/rear view → width. Side view (wide box) → wheelbase as visible span. */
export function assumedSpanM(
  bbox: { w: number; h: number },
  widthM: number,
  wheelbaseM: number | null,
): number {
  const aspect = bbox.w / Math.max(1, bbox.h);
  if (wheelbaseM && aspect > 2.05) return wheelbaseM;
  return widthM;
}
