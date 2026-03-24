import { notFound, redirect } from "next/navigation";
import {
  approveEventAction,
  publishApprovedEventAction,
  rejectEventAction,
} from "@/server/actions/admin-events";
import { getAdminEventById } from "@/server/queries/admin";
import { canAccessAdmin } from "@/lib/permissions";
import { formatEventDate, formatXof } from "@/lib/formatters";

type AdminEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

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

export default async function AdminEventDetailPage({
  params,
}: AdminEventDetailPageProps) {
  const { eventId } = await params;
  const data = await getAdminEventById(eventId);

  if (!canAccessAdmin(data?.context.session ?? null)) {
    redirect("/login");
  }

  if (!data?.event) {
    notFound();
  }

  const event = data.event;

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
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

            <h1 className="mt-4 text-4xl font-semibold">{event.title}</h1>
            <p className="mt-4 text-white/70">
              {event.shortDescription ?? "Description à venir."}
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {event.coverImageUrl ? (
                <img
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center text-white/40">
                  Image à venir
                </div>
              )}
            </div>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Description complète</h2>
              <p className="mt-5 whitespace-pre-line text-white/75">
                {event.fullDescription ?? "Description à venir."}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Occurrences & billets</h2>

              <div className="mt-6 space-y-6">
                {event.occurrences.map((occurrence) => (
                  <div
                    key={occurrence.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6"
                  >
                    <h3 className="text-xl font-semibold">
                      {occurrence.title ?? "Occurrence"}
                    </h3>
                    <p className="mt-2 text-white/70">
                      {formatEventDate(occurrence.startsAt.toISOString())}
                    </p>
                    <p className="mt-1 text-white/70">
                      {occurrence.venue.name}
                      {occurrence.venue.district
                        ? ` · ${occurrence.venue.district}`
                        : ""}
                    </p>
                    <p className="mt-1 text-white/50">
                      Capacité : {occurrence.capacity ?? "—"}
                    </p>

                    <div className="mt-5 space-y-3">
                      {occurrence.ticketTypes.map((ticketType) => (
                        <div
                          key={ticketType.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-medium">{ticketType.name}</p>
                              {ticketType.description ? (
                                <p className="mt-1 text-sm text-white/60">
                                  {ticketType.description}
                                </p>
                              ) : null}
                              {ticketType.isReservable &&
                              ticketType.reservationPolicy?.isEnabled ? (
                                <p className="mt-2 text-xs text-orange-300">
                                  Réservation activée · acompte{" "}
                                  {ticketType.reservationPolicy.depositPercent
                                    ? Number(ticketType.reservationPolicy.depositPercent)
                                    : 0}
                                  %
                                </p>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                {formatXof(Number(ticketType.priceAmount))}
                              </p>
                              <p className="mt-1 text-xs text-white/50">
                                {ticketType.totalStock} places
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Historique validation</h2>

              <div className="mt-6 space-y-4">
                {event.approvals.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
                    Aucun historique.
                  </div>
                ) : (
                  event.approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <p className="text-sm text-white/50">
                        {approval.createdAt.toLocaleString("fr-FR")}
                      </p>
                      <p className="mt-2 text-lg font-medium">
                        {approval.status}
                      </p>
                      <p className="mt-1 text-sm text-white/60">
                        {approval.reviewedBy?.email ?? "Système / non assigné"}
                      </p>
                      {approval.comment ? (
                        <p className="mt-3 text-white/75">{approval.comment}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div>
            <div className="sticky top-6 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
                  Décision admin
                </p>
                <p className="mt-3 text-white/70">
                  Analyse la fiche, les dates, la billetterie et décide du statut.
                </p>

                <form action={approveEventAction} className="mt-6 space-y-3">
                  <input type="hidden" name="eventId" value={event.id} />
                  <textarea
                    name="comment"
                    rows={4}
                    placeholder="Commentaire d’approbation"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-black transition hover:bg-emerald-400"
                  >
                    Approuver
                  </button>
                </form>

                <form action={rejectEventAction} className="mt-4 space-y-3">
                  <input type="hidden" name="eventId" value={event.id} />
                  <textarea
                    name="comment"
                    rows={4}
                    placeholder="Motif de rejet"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-red-500 px-5 py-3 font-medium text-white transition hover:bg-red-400"
                  >
                    Rejeter
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
                  Publication
                </p>
                <p className="mt-3 text-white/70">
                  La publication active l’événement dans le catalogue public.
                </p>

                <form action={publishApprovedEventAction} className="mt-6">
                  <input type="hidden" name="eventId" value={event.id} />
                  <button
                    type="submit"
                    disabled={event.status !== "APPROVED"}
                    className="w-full rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Publier l’événement
                  </button>
                </form>

                {event.status !== "APPROVED" ? (
                  <p className="mt-3 text-xs text-white/50">
                    L’événement doit être approuvé avant publication.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}