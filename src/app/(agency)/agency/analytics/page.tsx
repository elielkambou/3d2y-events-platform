import { redirect } from "next/navigation";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { getAgencyAnalytics } from "@/server/queries/agency-analytics";

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

export default async function AgencyAnalyticsPage() {
  const data = await getAgencyAnalytics();

  if (!data) {
    redirect("/login");
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Analytics
      </p>

      <h2 className="mt-3 text-3xl font-semibold">{data.agency.name}</h2>

      <p className="mt-4 max-w-2xl text-white/70">
        Vue d’ensemble des ventes, billets et commissions de la plateforme.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Événements</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.totalEvents}</p>
          <p className="mt-2 text-sm text-white/60">
            {data.stats.publishedEvents} publiés · {data.stats.submittedEvents} en validation
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Commandes</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.totalOrders}</p>
          <p className="mt-2 text-sm text-white/60">
            {data.stats.paidOrders} payées ou partiellement payées
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Billets</p>
          <p className="mt-2 text-3xl font-semibold">{data.stats.totalIssuedTickets}</p>
          <p className="mt-2 text-sm text-white/60">
            {data.stats.totalCheckedInTickets} déjà scannés
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Chiffre brut</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatXof(data.stats.grossSales)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Commission plateforme</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatXof(data.stats.commissionTotal)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Net agence</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatXof(data.stats.netTotal)}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
            Activité récente
          </p>
          <h3 className="mt-2 text-2xl font-semibold">Dernières commandes</h3>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucune commande pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {getOrderStatusLabel(order.status)}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {order.ticketTypeName}
                      </span>
                    </div>

                    <h4 className="mt-4 text-xl font-semibold">{order.eventTitle}</h4>

                    <div className="mt-3 space-y-1 text-sm text-white/65">
                      <p>{order.venueName}</p>
                      <p>Client : {order.customerName ?? order.customerEmail}</p>
                      <p>Email : {order.customerEmail}</p>
                      <p>Quantité : {order.quantity}</p>
                      <p>Créée le : {formatEventDate(order.createdAt)}</p>
                    </div>
                  </div>

                  <div className="min-w-[240px] rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-white/50">Montant total</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatXof(order.totalAmount)}
                    </p>

                    <p className="mt-4 text-sm text-white/50">Montant encaissé</p>
                    <p className="mt-1 text-lg font-medium">
                      {formatXof(order.paidAmount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}