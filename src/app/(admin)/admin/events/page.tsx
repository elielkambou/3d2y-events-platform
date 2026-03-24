import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSubmittedEvents } from "@/server/queries/admin";
import { canAccessAdmin } from "@/lib/permissions";
import { formatEventDate, formatXof } from "@/lib/formatters";

function getStatusLabel(status: string) {
  switch (status) {
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
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
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

              return (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="block rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-4xl">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                          {getStatusLabel(event.status)}
                        </span>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                          {event.agency.name}
                        </span>

                        {event.category ? (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                            {event.category.name}
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
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}