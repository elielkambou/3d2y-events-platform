import { redirect } from "next/navigation";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { getCurrentUserReservations } from "@/server/queries/reservations";
import { payReservationBalanceAction } from "@/server/actions/reservations";

export default async function AccountReservationsPage() {
  const data = await getCurrentUserReservations();

  if (!data?.session) {
    redirect("/login");
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Mes réservations
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Acomptes & soldes</h2>

      <p className="mt-4 text-white/70">
        Réservations avec acompte en attente de règlement du solde.
      </p>

      <div className="mt-10 space-y-6">
        {data.orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucune réservation active.
          </div>
        ) : (
          data.orders.map((order) => {
            const firstItem = order.items[0] ?? null;
            const occurrence = firstItem?.occurrence ?? null;
            const ticketType = firstItem?.ticketType ?? null;

            const totalAmount = Number(order.totalAmount);
            const paidAmount = order.payments.reduce(
              (sum, payment) => sum + Number(payment.amount),
              0,
            );
            const remainingAmount = totalAmount - paidAmount;

            return (
              <div
                key={order.id}
                className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-[1fr_320px]"
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {order.status}
                    </span>
                    {ticketType ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {ticketType.name}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold">
                    {occurrence?.event.title ?? "Réservation"}
                  </h3>

                  {occurrence ? (
                    <div className="mt-4 space-y-2 text-white/70">
                      <p>{formatEventDate(occurrence.startsAt.toISOString())}</p>
                      <p>
                        {occurrence.venue.name}
                        {occurrence.venue.district
                          ? ` · ${occurrence.venue.district}`
                          : ""}
                      </p>
                      <p>Organisateur : {occurrence.event.agency.name}</p>
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-2 text-white/70">
                    <p>Commande : {order.id.slice(0, 8).toUpperCase()}</p>
                    <p>Montant total : {formatXof(totalAmount)}</p>
                    <p>Acompte payé : {formatXof(paidAmount)}</p>
                    <p>Solde restant : {formatXof(remainingAmount)}</p>
                    <p>
                      Échéance :{" "}
                      {order.expiresAt
                        ? new Date(order.expiresAt).toLocaleString("fr-FR")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-sm text-white/50">Action</p>

                  {order.status === "PARTIALLY_PAID" ? (
                    <>
                      <p className="mt-3 text-white/70">
                        Tant que le solde n’est pas payé, les billets restent
                        réservés et non émis.
                      </p>

                      <form action={payReservationBalanceAction} className="mt-6">
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                          type="submit"
                          className="w-full rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400"
                        >
                          Payer le solde
                        </button>
                      </form>
                    </>
                  ) : (
                    <p className="mt-3 text-white/60">
                      Cette réservation a été remboursée. Aucun paiement
                      complémentaire possible.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}