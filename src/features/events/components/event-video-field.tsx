"use client";

import { useState } from "react";
import { EventVideoUpload } from "@/features/events/components/event-video-upload";

export function EventVideoField() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm text-white/70">
          Vidéo promotionnelle
        </label>
        <input
          name="promoVideoUrl"
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
        />
        <p className="mt-2 text-xs text-white/50">
          Optionnel. Colle un lien YouTube/Vimeo ou uploade directement une vidéo.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="mb-3 text-sm font-medium text-white">
          Ou uploader une vidéo
        </p>

        <EventVideoUpload
          onUploaded={(url) => {
            setValue(url);
          }}
        />
      </div>

      {value ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/50">URL vidéo retenue</p>
          <p className="mt-2 break-all text-sm text-white/80">{value}</p>
        </div>
      ) : null}
    </div>
  );
}