"use client";

import { useState } from "react";

type CheckoutLinkActionsProps = {
  ticketTypeId: string;
  maxPerOrder: number;
  isReservable: boolean;
};

export function CheckoutLinkActions({
  ticketTypeId,
  maxPerOrder,
  isReservable,
}: CheckoutLinkActionsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-2 block text-xs text-white/50">Quantité</label>
        <input
          type="number"
          min={1}
          max={maxPerOrder}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none"
        />
      </div>

      <a
        href={`/checkout?ticketTypeId=${ticketTypeId}&quantity=${quantity}&mode=buy`}
        className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-4 py-2 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
      >
        Acheter
      </a>

      {isReservable ? (
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