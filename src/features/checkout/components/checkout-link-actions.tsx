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
        className="rounded-xl bg-orange-500 px-4 py-2 font-medium text-black transition hover:bg-orange-400"
      >
        Acheter
      </a>

      {isReservable ? (
        <a
          href={`/checkout?ticketTypeId=${ticketTypeId}&quantity=${quantity}&mode=reserve`}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
        >
          Réserver
        </a>
      ) : null}
    </div>
  );
}