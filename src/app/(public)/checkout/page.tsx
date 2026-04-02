import { redirect } from "next/navigation";
import { getCheckoutPreview } from "@/server/queries/checkout";
import {
  completeCheckoutAction,
  completeReservationCheckoutAction,
} from "@/server/actions/checkout-page";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";

type CheckoutPageProps = {
  searchParams: Promise<{
    ticketTypeId?: string;
    quantity?: string;
    mode?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;

  const ticketTypeId = params.ticketTypeId ?? "";
  const quantity = Number(params.quantity ?? 1);
  const mode = params.mode === "reserve" ? "reserve" : "buy";

  if (!ticketTypeId || !quantity || quantity < 1) {
    redirect("/explore");
  }

  const preview = await getCheckoutPreview({
    ticketTypeId,
    quantity,
    mode,
  });

  if (!preview) {
    redirect("/explore");
  }

  const action =
    preview.mode === "buy"
      ? completeCheckoutAction
      : completeReservationCheckoutAction;

  return (
    <main className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
          Checkout
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {preview.mode === "buy" ? "Paiement immédiat" : "Réservation avec acompte"}
          </span>
          {preview.event.categoryName ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {preview.event.categoryName}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {preview.event.agencyName}
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {preview.mode === "buy"
            ? "Valider l'achat"
            : "Valider la réservation"}
        </h1>

        <p className="mt-4 max-w-2xl text-white/70">
          Vérifie le montant, complète ton moyen de paiement, puis confirme.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <CheckoutForm
              mode={preview.mode}
              ticketTypeId={preview.ticketType.id}
              quantity={preview.pricing.quantity}
              amountDueNow={preview.pricing.amountDueNow}
              remainingAmount={preview.pricing.remainingAmount}
              depositPercent={preview.pricing.depositPercent}
              defaultCustomerName={preview.user?.fullName ?? ""}
              defaultCustomerEmail={preview.user?.email ?? ""}
              defaultCustomerPhone={preview.user?.phone ?? ""}
              action={action}
            />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl">
              <div className="overflow-hidden border-b border-white/10">
                {preview.event.coverImageUrl ? (
                  <img
                    src={preview.event.coverImageUrl}
                    alt={preview.event.title}
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-black/30 text-white/40">
                    Image à venir
                  </div>
                )}
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-[#FF6B00]">
                  Récapitulatif
                </p>

                <h2 className="mt-3 text-2xl font-semibold">{preview.event.title}</h2>
                <p className="mt-3 text-white/70">
                  {preview.event.shortDescription ?? "Description à venir."}
                </p>

                <div className="mt-5 space-y-2 text-sm text-white/65">
                  <p>{formatEventDate(preview.occurrence.startsAt)}</p>
                  <p>
                    {preview.occurrence.venue.name}
                    {preview.occurrence.venue.district
                      ? ` · ${preview.occurrence.venue.district}`
                      : ""}
                  </p>
                  <p>Organisateur : {preview.event.agencyName}</p>
                  <p>Billet : {preview.ticketType.name}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
                Montant
              </p>

              <div className="mt-5 space-y-3 text-white/75">
                <div className="flex items-center justify-between">
                  <span>Prix unitaire</span>
                  <span>{formatXof(preview.pricing.unitPrice)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Quantité</span>
                  <span>{preview.pricing.quantity}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Sous-total</span>
                  <span>{formatXof(preview.pricing.subtotal)}</span>
                </div>

                {preview.mode === "reserve" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Acompte ({preview.pricing.depositPercent}%)</span>
                      <span>{formatXof(preview.pricing.amountDueNow)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Solde restant</span>
                      <span>{formatXof(preview.pricing.remainingAmount)}</span>
                    </div>
                  </>
                ) : null}

                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-lg font-semibold text-white">
                    <span>À payer maintenant</span>
                    <span>{formatXof(preview.pricing.amountDueNow)}</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}