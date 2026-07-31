"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function ProfilePhotoField({
  photoUrl,
  name,
  uploading,
  onUpload,
}: {
  photoUrl: string | null | undefined;
  name: string;
  uploading?: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const src = preview ?? mediaUrl(photoUrl);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-paper text-xl font-semibold text-ink-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          initials || "?"
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Profile photo</p>
        <p className="mt-0.5 text-xs text-ink-muted">JPEG, PNG, or WebP · max 2 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
            onUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-3.5 w-3.5" aria-hidden />
          {uploading ? "Uploading…" : src ? "Change photo" : "Upload photo"}
        </Button>
      </div>
    </div>
  );
}
