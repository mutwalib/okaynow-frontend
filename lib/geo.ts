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
