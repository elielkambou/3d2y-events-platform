"use client";

import { useId, useMemo, useState } from "react";

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

type WordCountTextareaProps = {
  name: string;
  label: string;
  required?: boolean;
  rows?: number;
  className?: string;
  placeholder?: string;
  minWords?: number;
  maxWords?: number;
};

export function WordCountTextarea({
  name,
  label,
  required,
  rows = 3,
  className,
  placeholder,
  minWords,
  maxWords,
}: WordCountTextareaProps) {
  const id = useId();
  const [value, setValue] = useState("");

  const words = useMemo(() => countWords(value), [value]);
  const isEmpty = value.trim().length === 0;
  const belowMin = typeof minWords === "number" && words > 0 && words < minWords;
  const aboveMax = typeof maxWords === "number" && words > maxWords;

  const hint = useMemo(() => {
    if (isEmpty) {
      const parts: string[] = [];
      if (typeof minWords === "number") parts.push(`minimum ${minWords} mots`);
      if (typeof maxWords === "number") parts.push(`maximum ${maxWords} mots`);
      if (parts.length === 0) return "Saisis ta description.";
      return `À renseigner (${parts.join(" · ")}).`;
    }

    if (belowMin) return `Encore ${minWords! - words} mots pour atteindre le minimum.`;
    if (aboveMax) return `Tu as dépassé le maximum de ${maxWords} mots.`;
    return "OK.";
  }, [aboveMax, belowMin, isEmpty, maxWords, minWords, words]);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-white/70">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={
          className ??
          "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
        }
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <p
          className={
            aboveMax || belowMin ? "text-red-300" : "text-white/50"
          }
        >
          {hint}
        </p>
        <p className="tabular-nums text-white/50">{words} mots</p>
      </div>
    </div>
  );
}

