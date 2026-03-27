"use client";

import { useMemo, useRef, useState } from "react";

type MinLengthTextareaProps = {
  name: string;
  rows?: number;
  minChars: number;
  placeholder: string;
  defaultValue?: string;
};

export function MinLengthTextarea({
  name,
  rows = 3,
  minChars,
  placeholder,
  defaultValue = "",
}: MinLengthTextareaProps) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const trimmedLength = useMemo(() => value.trim().length, [value]);
  const isValid = trimmedLength >= minChars;

  function updateValidity(nextValue: string) {
    const element = ref.current;
    if (!element) return;

    const length = nextValue.trim().length;

    if (length < minChars) {
      element.setCustomValidity(
        `Nombre de caractères insuffisant : ${length}/${minChars} minimum.`,
      );
    } else {
      element.setCustomValidity("");
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        name={name}
        rows={rows}
        required
        value={value}
        onChange={(e) => {
          const nextValue = e.target.value;
          setValue(nextValue);
          updateValidity(nextValue);
        }}
        onBlur={(e) => updateValidity(e.target.value)}
        placeholder={`${placeholder} (minimum ${minChars} caractères)`}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
      />

      <div className="flex items-center justify-between text-xs">
        <p className="text-white/50">Minimum {minChars} caractères.</p>
        <p className={isValid ? "text-emerald-300" : "text-orange-300"}>
          {trimmedLength}/{minChars}
        </p>
      </div>
    </div>
  );
}