"use client";

import { useState } from "react";

type CheckoutLinkActionsProps = {
  ticketTypeId: string;
  maxPerOrder: number;
  canReserve: boolean;
};

export function CheckoutLinkActions({
  ticketTypeId,
  maxPerOrder,
  canReserve,
}: CheckoutLinkActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const safeMax = Math.max(1, maxPerOrder);
  const canDecrease = quantity > 1;
  const canIncrease = quantity < safeMax;

  function updateQuantity(next: number) {
    const clamped = Math.min(Math.max(next, 1), safeMax);
    setQuantity(clamped);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-2 block text-xs text-white/50">Quantité</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuantity(quantity - 1)}
            disabled={!canDecrease}
            className="h-9 w-9 rounded-xl border border-white/10 bg-black/40 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            -
          </button>
          <div className="w-12 rounded-xl border border-white/10 bg-black/40 py-2 text-center text-sm font-medium">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => updateQuantity(quantity + 1)}
            disabled={!canIncrease}
            className="h-9 w-9 rounded-xl border border-white/10 bg-black/40 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      <a
        href={`/checkout?ticketTypeId=${ticketTypeId}&quantity=${quantity}&mode=buy`}
        className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-4 py-2 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
      >
        Acheter
      </a>

      {canReserve ? (
        <a
          href={`/checkout?ticketTypeId=${ticketTypeId}&quantity=${quantity}&mode=reserve`}
          className="rounded-xl border border-white/10 bg-gradient-to-r from-[#FF6B00]/10 to-[#8B5CF6]/10 px-4 py-2 font-medium text-white transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
        >
          Réserver
        </a>
      ) : null}
    </div>
  );
}