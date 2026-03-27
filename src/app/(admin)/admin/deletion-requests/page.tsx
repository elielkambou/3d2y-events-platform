import { redirect } from "next/navigation";
import { getAdminEventDeletionRequests } from "@/server/queries/admin-deletion-requests";
import {
  approveEventDeletionRequestAction,
  rejectEventDeletionRequestAction,
} from "@/server/actions/event-deletion";
import { MinLengthTextarea } from "@/components/forms/min-length-textarea";
function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "APPROVED":
      return "Approuvée";
    case "REJECTED":
      return "Rejetée";
    case "CANCELED":
      return "Annulée";
    default:
      return status;
  }
}

export default async function AdminDeletionRequestsPage() {
  const data = await getAdminEventDeletionRequests();

  if (!data) {
    redirect("/login");
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Suppressions
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Demandes de suppression</h2>

      <p className="mt-4 text-white/70">
        Validation admin des demandes de retrait d’événements.
      </p>

      <div className="mt-10 space-y-6">
        {data.requests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucune demande de suppression.
          </div>
        ) : (
          data.requests.map((request) => (
            <div
              key={request.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  {getStatusLabel(request.status)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  {request.agency.name}
                </span>
                {request.event.category ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                    {request.event.category.name}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 text-2xl font-semibold">{request.event.title}</h3>

              <div className="mt-4 space-y-2 text-sm text-white/65">
                <p>Demandé par : {request.requestedBy.email}</p>
                <p>Date : {request.createdAt.toLocaleString("fr-FR")}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/75">
                {request.reason}
              </div>

              {request.status === "PENDING" ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <form action={approveEventDeletionRequestAction} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <input type="hidden" name="requestId" value={request.id} />
                    <textarea
                      name="adminComment"
                      rows={3}
                      placeholder="Commentaire admin (optionnel)"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-red-500 px-4 py-3 font-medium text-white transition hover:bg-red-400"
                    >
                      Approuver et supprimer
                    </button>
                  </form>

                  <form action={rejectEventDeletionRequestAction} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <input type="hidden" name="requestId" value={request.id} />
                    <MinLengthTextarea
                      name="adminComment"
                      rows={3}
                      minChars={5}
                      placeholder="Motif du refus"
                    />
                    <p className="text-xs text-white/50">
                       Minimum 5 caractères.
                    </p>
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10"
                    >
                      Rejeter la demande
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  <p>Traité par : {request.reviewedBy?.email ?? "—"}</p>
                  <p className="mt-2">{request.adminComment ?? "Aucun commentaire admin."}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}