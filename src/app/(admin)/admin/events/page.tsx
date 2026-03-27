import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSubmittedEvents } from "@/server/queries/admin";
import { canAccessAdmin } from "@/lib/permissions";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { adminDeleteEventAction } from "@/server/actions/event-deletion";

function getStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "SUBMITTED":
      return "Soumis";
    case "UNDER_REVIEW":
      return "En revue";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "PUBLISHED":
      return "Publié";
    case "ARCHIVED":
      return "Archivé";
    case "CANCELLED":
      return "Annulé";
    default:
      return status;
  }
}

export default async function AdminEventsPage() {
  const data = await getAdminSubmittedEvents();

  if (!canAccessAdmin(data?.context.session ?? null)) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
            Validation
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Événements à revoir</h1>
          <p className="mt-4 text-white/70">
            Relecture éditoriale, validation et publication.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {data?.events.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
              Aucun événement à traiter.
            </div>
          ) : (
            data!.events.map((event) => {
              const firstOccurrence = event.occurrences[0] ?? null;
              const firstTicket = firstOccurrence?.ticketTypes[0] ?? null;
              const lastReview = event.approvals[0] ?? null;
              const latestDeletionRequest = event.deletionRequests[0] ?? null;

              return (
                <div
                  key={event.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:bg-white/10 hover:shadow-[0_0_25px_rgba(139,92,246,0.12)]"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-4xl">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                          {getStatusLabel(event.status)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                          {event.agency.name}
                        </span>

                        {event.category ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                            {event.category.name}
                          </span>
                        ) : null}

                        {latestDeletionRequest ? (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-200">
                            Demande suppression : {latestDeletionRequest.status}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-4 text-2xl font-semibold">{event.title}</h2>
                      <p className="mt-3 text-white/70">
                        {event.shortDescription ?? "Description à venir."}
                      </p>

                      {firstOccurrence ? (
                        <div className="mt-5 space-y-1 text-sm text-white/60">
                          <p>{formatEventDate(firstOccurrence.startsAt.toISOString())}</p>
                          <p>
                            {firstOccurrence.venue.name}
                            {firstOccurrence.venue.district
                              ? ` · ${firstOccurrence.venue.district}`
                              : ""}
                          </p>
                        </div>
                      ) : null}

                      {lastReview ? (
                        <p className="mt-5 text-sm text-white/50">
                          Dernier avis : {lastReview.status}
                          {lastReview.reviewedBy?.email
                            ? ` par ${lastReview.reviewedBy.email}`
                            : ""}
                        </p>
                      ) : null}

                      {/* Vrai bouton / lien vers la page de détails */}
                      <div className="mt-6">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="inline-flex rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                          Voir le détail
                        </Link>
                      </div>
                    </div>

                    <div className="min-w-[320px] space-y-4">
                      {/* Résumé prix & occurrences */}
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-[#FF6B00]/5 p-4 backdrop-blur-xl">
                        <p className="text-sm text-white/50">À partir de</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {formatXof(firstTicket ? Number(firstTicket.priceAmount) : null)}
                        </p>

                        <p className="mt-4 text-sm text-white/50">Occurrences</p>
                        <p className="mt-1 text-lg font-medium">
                          {event.occurrences.length}
                        </p>
                      </div>

                      {/* Formulaire de suppression rapide */}
                      <form
                        action={adminDeleteEventAction}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <input type="hidden" name="eventId" value={event.id} />
                        <label className="mb-2 block text-sm text-white/60">
                          Motif de suppression
                        </label>
                        <textarea
                          name="reason"
                          rows={3}
                          minLength={10}
                          required
                          placeholder="Motif interne de suppression"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                        />
                        <p className="mt-2 text-xs text-white/50">
                          Minimum 10 caractères.
                        </p>

                        <button
                          type="submit"
                          className="mt-4 w-full rounded-2xl bg-red-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-400"
                        >
                          Supprimer directement
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}