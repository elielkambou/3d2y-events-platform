"use client";

import { useRef, useState } from "react";

type EventVideoUploadProps = {
  onUploaded: (url: string) => void;
};

export function EventVideoUpload({ onUploaded }: EventVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("La vidéo dépasse 10 Mo.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/event-video", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload impossible.");
      }

      onUploaded(data.url);
      setMessage("Vidéo uploadée avec succès.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
          }}
          className="block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:font-medium file:text-black hover:file:bg-orange-400"
        />
      </div>

      <p className="text-xs text-white/50">
        Formats acceptés : MP4, WebM, OGG. Taille maximale : 10 Mo.
      </p>

      {isUploading ? (
        <p className="text-sm text-orange-300">Upload en cours…</p>
      ) : null}

      {message ? (
        <p className="text-sm text-emerald-300">{message}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}