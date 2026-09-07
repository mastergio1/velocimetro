import { useEffect, useRef } from "react";
import { toDisplaySpeed } from "@/lib/speed/format";
import type { Units } from "@/lib/speed/types";

type Props = {
  history: number[];
  units: Units;
};

export function Sparkline({ history, units }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const cssW = parent?.clientWidth || 320;
    const cssH = 44;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (history.length < 2) return;

    const values = history.map((m) => toDisplaySpeed(m, units));
    const max = Math.max(40, ...values);
    const min = 0;
    const w = canvas.width;
    const h = canvas.height;
    const step = w / Math.max(1, values.length - 1);

    ctx.beginPath();
    values.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min)) * (h - 4 * dpr) - 2 * dpr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "rgba(197, 212, 222, 0.85)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(197, 212, 222, 0.18)");
    g.addColorStop(1, "rgba(197, 212, 222, 0)");
    ctx.fillStyle = g;
    ctx.fill();
  }, [history, units]);

  return <canvas ref={ref} className="h-11 w-full" aria-hidden />;
}
