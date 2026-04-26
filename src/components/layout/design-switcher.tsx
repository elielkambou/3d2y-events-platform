"use client";

import { useEffect, useState } from "react";

type DesignId = "sunrise" | "breeze" | "midnight-pop" | "crimson-ink";

const STORAGE_KEY = "public-design-variant";

const DESIGN_OPTIONS: Array<{ id: DesignId; label: string }> = [
  { id: "sunrise", label: "Design A" },
  { id: "breeze", label: "Design B" },
  { id: "midnight-pop", label: "Design C" },
  { id: "crimson-ink", label: "Design D" },
];

export function DesignSwitcher() {
  const [variant, setVariant] = useState<DesignId>("sunrise");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as DesignId | null;
    const next = stored && DESIGN_OPTIONS.some((option) => option.id === stored)
      ? stored
      : "sunrise";
    setVariant(next);
    document.documentElement.setAttribute("data-design", next);
  }, []);

  function updateVariant(next: DesignId) {
    setVariant(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-design", next);
  }

  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-xs text-foreground/60 sm:inline">Aperçu</span>
      <select
        value={variant}
        onChange={(event) => updateVariant(event.target.value as DesignId)}
        className="rounded-lg border border-border/80 bg-background/80 px-2 py-1.5 text-[11px] text-foreground sm:px-2.5 sm:text-xs"
      >
        {DESIGN_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
