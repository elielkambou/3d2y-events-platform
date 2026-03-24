import Link from "next/link";
import { redirect } from "next/navigation";
import { getAgencyEvents } from "@/server/queries/agency";
import { getSession } from "@/lib/auth/session";
import { canManageAgency } from "@/lib/permissions";
import { formatEventDate, formatXof } from "@/lib/formatters";

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
          <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
            Mes événements
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Catalogue agence</h2>
          <p className="mt-4 text-white/70">
            {data.agency.name} · suivi des créations, soumissions et publications
          </p>
        </div>

        <Link
          href="/agency/events/new"
          className="rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400"
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

            return (
              <div
                key={event.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {getStatusLabel(event.status)}
                      </span>

                      {event.category ? (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
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
                  </div>

                  <div className="min-w-[220px] rounded-2xl border border-white/10 bg-black/20 p-4">
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