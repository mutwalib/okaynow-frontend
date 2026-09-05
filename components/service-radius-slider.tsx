"use client";

export const SERVICE_RADIUS_MIN = 1;
export const SERVICE_RADIUS_MAX = 200;
export const SERVICE_RADIUS_DEFAULT = 25;

export function clampServiceRadius(value: number | null | undefined | ""): number {
  if (value === "" || value == null || Number.isNaN(Number(value))) {
    return SERVICE_RADIUS_DEFAULT;
  }
  return Math.min(
    SERVICE_RADIUS_MAX,
    Math.max(SERVICE_RADIUS_MIN, Math.round(Number(value))),
  );
}

export function ServiceRadiusSlider({
  value,
  onChange,
  disabled = false,
  id = "service-radius",
}: {
  value: number;
  onChange: (miles: number) => void;
  disabled?: boolean;
  id?: string;
}) {
  const miles = clampServiceRadius(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          Service radius
        </label>
        <span className="text-sm font-semibold tabular-nums text-brand-deep">
          {miles} mi
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={SERVICE_RADIUS_MIN}
        max={SERVICE_RADIUS_MAX}
        step={1}
        value={miles}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand disabled:cursor-not-allowed disabled:opacity-60"
        style={{ accentColor: "var(--color-brand, #0d7377)" }}
      />
      <div className="flex justify-between text-xs text-ink-muted">
        <span>{SERVICE_RADIUS_MIN} mi</span>
        <span>How far you’ll travel for shifts</span>
        <span>{SERVICE_RADIUS_MAX} mi</span>
      </div>
    </div>
  );
}
