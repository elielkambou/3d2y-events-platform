import { redirect } from "next/navigation";
import { formatXof } from "@/lib/formatters";
import { getAdminRefunds } from "@/server/queries/admin-finance";

function getRefundStatusLabel(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Demandé";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "PROCESSED":
      return "Traité";
    case "CANCELLED":
      return "Annulé";
    default:
      return status;
  }
}

export default async function AdminRefundsPage() {
  const data = await getAdminRefunds();

  if (!data) {
    redirect("/login");
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Finance admin
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Remboursements</h2>

      <p className="mt-4 text-white/70">
        Historique des remboursements traités par la plateforme.
      </p>

      <div className="mt-10 space-y-6">
        {data.refunds.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucun remboursement.
          </div>
        ) : (
          data.refunds.map((refund) => (
            <div
              key={refund.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {getRefundStatusLabel(refund.status)}
                    </span>

                    {refund.order?.agency ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {refund.order.agency.name}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold">
                    {refund.ticket?.occurrence.event.title ??
                      "Remboursement commande"}
                  </h3>

                  <div className="mt-4 space-y-1 text-sm text-white/65">
                    {refund.order ? (
                      <p>Commande : {refund.order.id.slice(0, 8).toUpperCase()}</p>
                    ) : null}
                    {refund.ticket ? <p>Billet : {refund.ticket.serialNumber}</p> : null}
                    <p>Demandé par : {refund.requestedBy?.email ?? "—"}</p>
                    <p>Traité par : {refund.reviewedBy?.email ?? "—"}</p>
                    <p>Date : {refund.createdAt.toLocaleString("fr-FR")}</p>
                  </div>

                  {refund.reason ? (
                    <p className="mt-4 text-white/75">{refund.reason}</p>
                  ) : null}
                </div>

                <div className="min-w-[260px] rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white/50">Montant demandé</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatXof(
                      refund.requestedAmount ? Number(refund.requestedAmount) : 0,
                    )}
                  </p>

                  <p className="mt-4 text-sm text-white/50">Montant approuvé</p>
                  <p className="mt-1 text-lg font-medium">
                    {formatXof(
                      refund.approvedAmount ? Number(refund.approvedAmount) : 0,
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}