import type { CameraFacing } from "./types";

export function cameraErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const ios =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const inApp = isInAppBrowser();

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "La cámara pide HTTPS. Abre VELOX en Safari, en el candado del sitio.";
  }
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    if (inApp) {
      return "Este visor bloqueó la cámara. Toca Compartir → Abrir en Safari y vuelve a pulsar Cámara.";
    }
    return ios
      ? "Safari bloqueó la cámara. Ajustes → Safari → Cámara → Permitir, y recarga."
      : "Permiso de cámara denegado. Actívalo en Ajustes y vuelve a pulsar Cámara.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No encuentro una cámara. Prueba la otra (trasera/frontal) en Ajustes.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "La cámara está ocupada. Cierra otras apps que la usen y pulsa de nuevo.";
  }
  if (name === "OverconstrainedError") {
    return "Esa cámara no acepta el modo pedido. Vuelve a pulsar Cámara.";
  }
  if (name === "SecurityError" || name === "NotSupportedError") {
    return inApp
      ? "Abre VELOX en Safari (Compartir → Abrir en Safari) para usar la cámara."
      : "Hace falta Safari o Chrome, con HTTPS, o añadir VELOX a la pantalla de inicio.";
  }
  if (name === "AbortError") {
    return "Se canceló la cámara. Pulsa de nuevo para abrirla.";
  }
  if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
    return inApp
      ? "Este visor no entrega la cámara. Abre el mismo enlace en Safari."
      : "Este navegador no entrega la cámara. Prueba Safari (iPhone) o Chrome (Android).";
  }
  return "No se pudo abrir la cámara. Pulsa otra vez o ábrelo en Safari.";
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Grok|Instagram|FBAN|FBAV|Twitter|Line\//i.test(ua) ||
    (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua));
}

export async function openCamera(
  facing: CameraFacing,
  highFps = true,
): Promise<MediaStream> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    const err = new Error("Insecure context");
    err.name = "SecurityError";
    throw err;
  }
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    const err = new Error("No hay API de cámara.");
    err.name = "NotSupportedError";
    throw err;
  }

  const fps = highFps
    ? { ideal: 60, min: 24 }
    : { ideal: 30, max: 30 };

  const attempts: MediaTrackConstraints[] = [
    {
      facingMode: { ideal: facing },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: fps,
    },
    { facingMode: { ideal: facing }, frameRate: fps },
    { facingMode: { ideal: facing } },
    { facingMode: facing },
  ];

  let last: unknown;
  for (const video of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video });
    } catch (e) {
      last = e;
    }
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  } catch (e) {
    throw last ?? e;
  }
}

export function attachStream(video: HTMLVideoElement, stream: MediaStream) {
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.srcObject = stream;
}
