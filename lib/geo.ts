/** Sandata-aligned visit radius (~250 ft). */
export const EVV_GEOFENCE_FEET = 250;
export const EVV_GEOFENCE_METERS = EVV_GEOFENCE_FEET * 0.3048;

export type GpsCoords = { lat: number; lng: number };

/** Best-effort browser GPS; returns empty coords if denied/unavailable. */
export function captureGps(): Promise<{ lat?: number; lng?: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({});
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}

/** Haversine distance in meters. */
export function distanceMeters(a: GpsCoords, b: GpsCoords): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinGeofence(
  user: GpsCoords | null | undefined,
  site: GpsCoords | null | undefined,
  radiusMeters = EVV_GEOFENCE_METERS,
): boolean {
  if (!user || !site) return false;
  if (
    Number.isNaN(site.lat) ||
    Number.isNaN(site.lng) ||
    Number.isNaN(user.lat) ||
    Number.isNaN(user.lng)
  ) {
    return false;
  }
  return distanceMeters(user, site) <= radiusMeters;
}
