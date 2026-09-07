export type GpsFix = {
  speedMps: number | null;
  accuracy: number | null;
  heading: number | null;
  altitude: number | null;
  lat: number | null;
  lng: number | null;
  timestamp: number;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function createGpsWatcher(onFix: (fix: GpsFix) => void, onError: (msg: string) => void) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError("Este dispositivo no ofrece geolocalización.");
    return () => {};
  }

  let last: GeolocationPosition | null = null;

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      let speed = pos.coords.speed;
      if ((speed == null || Number.isNaN(speed) || speed < 0) && last) {
        const dt = (pos.timestamp - last.timestamp) / 1000;
        if (dt > 0.35 && dt < 8) {
          const d = haversine(
            last.coords.latitude,
            last.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude,
          );
          speed = d / dt;
        }
      }
      last = pos;
      onFix({
        speedMps: speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null,
        accuracy: pos.coords.accuracy ?? null,
        heading:
          pos.coords.heading != null && Number.isFinite(pos.coords.heading)
            ? pos.coords.heading
            : null,
        altitude: pos.coords.altitude,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: pos.timestamp,
      });
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        onError("Permiso de ubicación denegado.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        onError("Ubicación no disponible.");
      } else {
        onError("GPS no responde.");
      }
    },
    { enableHighAccuracy: true, maximumAge: 400, timeout: 9000 },
  );

  return () => navigator.geolocation.clearWatch(id);
}

export async function requestMotionPermission(): Promise<void> {
  const orient = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  if (typeof orient.requestPermission === "function") {
    try {
      await orient.requestPermission();
    } catch {
      /* iOS may reject outside a gesture; ignore */
    }
  }
  const motion = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  if (typeof motion.requestPermission === "function") {
    try {
      await motion.requestPermission();
    } catch {
      /* ignore */
    }
  }
}

export function compassFromEvent(e: DeviceOrientationEvent): number | null {
  const webkit = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
  if (typeof webkit.webkitCompassHeading === "number") return webkit.webkitCompassHeading;
  if (typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}
