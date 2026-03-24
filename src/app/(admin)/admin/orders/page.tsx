import { redirect } from "next/navigation";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { getAdminOrders } from "@/server/queries/admin-finance";
import { refundOrderAction } from "@/server/actions/admin-refunds";

function getOrderStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "PARTIALLY_PAID":
      return "Acompte payé";
    case "PAID":
      return "Payée";
    case "CANCELLED":
      return "Annulée";
    case "EXPIRED":
      return "Expirée";
    case "REFUNDED":
      return "Remboursée";
    default:
      return status;
  }
}

export default async function AdminOrdersPage() {
  const data = await getAdminOrders();

  if (!data) {
    redirect("/login");
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Finance admin
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Commandes</h2>

      <p className="mt-4 text-white/70">
        Vue d’ensemble des ventes, acomptes et remboursements.
      </p>

      <div className="mt-10 space-y-6">
        {data.orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucune commande.
          </div>
        ) : (
          data.orders.map((order) => {
            const firstItem = order.items[0] ?? null;
            const paidAmount = order.payments
              .filter(
                (payment) =>
                  payment.status === "SUCCEEDED" || payment.status === "REFUNDED",
              )
              .reduce((sum, payment) => sum + Number(payment.amount), 0);

            const canRefund =
              order.status !== "REFUNDED" &&
              order.payments.some((payment) => payment.status === "SUCCEEDED") &&
              !order.items
                .flatMap((item) => item.tickets)
                .some((ticket) => ticket.status === "CHECKED_IN");

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {getOrderStatusLabel(order.status)}
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {order.agency.name}
                      </span>

                      {firstItem ? (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                          {firstItem.ticketType.name}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold">
                      {firstItem?.occurrence.event.title ?? "Commande"}
                    </h3>

                    <div className="mt-4 space-y-1 text-sm text-white/65">
                      <p>Client : {order.customerName ?? order.customerEmail}</p>
                      <p>Email : {order.customerEmail}</p>
                      <p>Référence : {order.id.slice(0, 8).toUpperCase()}</p>
                      {firstItem ? (
                        <>
                          <p>{formatEventDate(firstItem.occurrence.startsAt.toISOString())}</p>
                          <p>
                            {firstItem.occurrence.venue.name}
                            {firstItem.occurrence.venue.district
                              ? ` · ${firstItem.occurrence.venue.district}`
                              : ""}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[320px] space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white/50">Montant total</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatXof(Number(order.totalAmount))}
                      </p>

                      <p className="mt-4 text-sm text-white/50">Montant encaissé</p>
                      <p className="mt-1 text-lg font-medium">
                        {formatXof(paidAmount)}
                      </p>
                    </div>

                    <form
                      action={refundOrderAction}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <input type="hidden" name="orderId" value={order.id} />
                      <label className="mb-2 block text-sm text-white/60">
                        Motif du remboursement
                      </label>
                      <textarea
                        name="reason"
                        rows={3}
                        placeholder="Ex: annulation événement, geste commercial..."
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!canRefund}
                        className="mt-4 w-full rounded-2xl bg-red-500 px-5 py-3 font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Rembourser la commande
                      </button>

                      {!canRefund ? (
                        <p className="mt-3 text-xs text-white/50">
                          Remboursement indisponible si déjà remboursée, non encaissée
                          ou déjà scannée.
                        </p>
                      ) : null}
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}