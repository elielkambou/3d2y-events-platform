import Link from "next/link";
import { redirect } from "next/navigation";
import { getAgencyEvents } from "@/server/queries/agency";
import { getSession } from "@/lib/auth/session";
import { canManageAgency } from "@/lib/permissions";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { requestEventDeletionAction } from "@/server/actions/event-deletion";
import { MinLengthTextarea } from "@/components/forms/min-length-textarea";

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

export default async function AgencyEventsPage() {
  const session = await getSession();

  if (!canManageAgency(session)) {
    redirect("/login");
  }

  const data = await getAgencyEvents();

  if (!data) {
    redirect("/login");
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
            Mes événements
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Catalogue agence</h2>
          <p className="mt-4 text-white/70">
            {data.agency.name} · suivi des créations, soumissions et publications
          </p>
        </div>

        <Link
          href="/agency/events/new"
          className="rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-5 py-3 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
        >
          Nouvel événement
        </Link>
      </div>

      <div className="mt-10 space-y-6">
        {data.events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucun événement pour le moment.
          </div>
        ) : (
          data.events.map((event) => {
            const firstOccurrence = event.occurrences[0] ?? null;
            const firstTicket = firstOccurrence?.ticketTypes[0] ?? null;

            const latestDeletionRequest = event.deletionRequests[0] ?? null;

            return (
              <div
                key={event.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                        {getStatusLabel(event.status)}
                      </span>

                      {event.category ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                          {event.category.name}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold">{event.title}</h3>
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

                    {/* --- Bloc suppression ajouté ici --- */}
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white/50">Suppression</p>

                      {event.isDeleted ? (
                        <p className="mt-3 text-sm text-red-200">
                          Cet événement a été retiré de la plateforme.
                        </p>
                      ) : latestDeletionRequest?.status === "PENDING" ? (
                        <p className="mt-3 text-sm text-orange-200">
                          Une demande de suppression est en attente de validation admin.
                        </p>
                      ) : (
                        <form action={requestEventDeletionAction} className="mt-4 space-y-3">
                          <input type="hidden" name="eventId" value={event.id} />
                          <MinLengthTextarea
                            name="reason"
                            rows={3}
                            minChars={10}
                            placeholder="Explique pourquoi tu demandes la suppression de cet événement"
                          />
                          <button
                            type="submit"
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                          >
                            Demander la suppression
                          </button>
                        </form>
                      )}
                    </div>
                    {/* --- Fin du bloc suppression --- */}
                  </div>

                  <div className="min-w-[220px] rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-[#FF6B00]/5 p-4 backdrop-blur-xl">
                    <p className="text-sm text-white/50">À partir de</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatXof(firstTicket ? Number(firstTicket.priceAmount) : null)}
                    </p>

                    <p className="mt-4 text-sm text-white/50">Occurrences</p>
                    <p className="mt-1 text-lg font-medium">
                      {event.occurrences.length}
                    </p>
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