import type { CameraFacing } from "./types";

export function cameraErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const ios =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent);

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return ios
      ? "Safari bloqueó la cámara. Ajustes → Safari → Cámara → Permitir, y recarga."
      : "Permiso de cámara denegado. Actívalo en Ajustes del sistema y vuelve a pulsar Cámara.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No encuentro una cámara. Prueba la otra (trasera/frontal) en Ajustes.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "La cámara está ocupada por otra app. Ciérrala y reintenta.";
  }
  if (name === "OverconstrainedError") {
    return "Esa cámara no acepta el modo pedido. Probé un perfil más simple; vuelve a activar.";
  }
  if (name === "SecurityError" || name === "NotSupportedError") {
    return "Hace falta una conexión segura (HTTPS) o instalar VELOX en la pantalla de inicio.";
  }
  if (name === "AbortError") {
    return "Se canceló la cámara. Pulsa de nuevo para abrirla.";
  }
  if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
    return "Este navegador no entrega la cámara. Abre VELOX en Safari (iPhone/iPad) o Chrome (Android), instalada o en HTTPS.";
  }
  return "No se pudo abrir la cámara. Reintenta o prueba otro navegador del teléfono.";
}

export async function openCamera(facing: CameraFacing): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    const err = new Error("No hay API de cámara.");
    err.name = "NotSupportedError";
    throw err;
  }

  const attempts: MediaTrackConstraints[] = [
    {
      facingMode: { ideal: facing },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
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
