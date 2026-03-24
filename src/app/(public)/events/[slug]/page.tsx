import { notFound } from "next/navigation";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { getPublishedEventBySlug } from "@/server/queries/catalog";
import { getSession } from "@/lib/auth/session";
import { createCheckoutOrderAction } from "@/server/actions/checkout";
import { createReservationAction } from "@/server/actions/reservations";
type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  const session = await getSession();

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
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
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
                {event.category?.name ?? "Événement"}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                {event.title}
              </h1>
              <p className="mt-4 text-white/70">
                {event.shortDescription ?? event.fullDescription ?? "Description à venir."}
              </p>

              <div className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Organisateur
                  </p>
                  <p className="mt-1 text-lg font-medium">{event.agency.name}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Dates disponibles
                  </p>
                  <p className="mt-1 text-lg font-medium">
                    {event.occurrences.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    À partir de
                  </p>
                  <p className="mt-1 text-lg font-medium">
                    {formatXof(
                      event.occurrences.flatMap((o) =>
                        o.ticketTypes.map((t) => t.priceAmount),
                      ).length
                        ? Math.min(
                            ...event.occurrences.flatMap((o) =>
                              o.ticketTypes.map((t) => t.priceAmount),
                            ),
                          )
                        : null,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
              À propos
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Description</h2>
            <p className="mt-5 whitespace-pre-line text-white/75">
              {event.fullDescription ?? event.shortDescription ?? "Description à venir."}
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
              Billetterie
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Dates & billets</h2>

            <div className="mt-6 space-y-6">
              {event.occurrences.map((occurrence) => (
                <div
                  key={occurrence.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="mb-5 space-y-2">
                    <h3 className="text-xl font-semibold">
                      {occurrence.title ?? "Occurrence"}
                    </h3>
                    <p className="text-white/70">
                      {formatEventDate(occurrence.startsAt)}
                    </p>
                    <p className="text-white/70">
                      {occurrence.venue.name}
                      {occurrence.venue.district
                        ? ` · ${occurrence.venue.district}`
                        : ""}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {occurrence.ticketTypes.map((ticketType) => (
                        <div
                            key={ticketType.id}
                            className="rounded-2xl border border-white/10 bg-black/30 p-4"
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
                                <p className="mt-3 text-xs text-orange-300">
                                    Réservable avec acompte de{" "}
                                    {ticketType.reservationPolicy.depositPercent ?? 0}%
                                </p>
                                ) : null}
                            </div>

                            <div className="text-right">
                                <p className="text-lg font-semibold">
                                {formatXof(ticketType.priceAmount)}
                                </p>
                                <p className="mt-1 text-xs text-white/50">
                                max {ticketType.maxPerOrder ?? "—"} / commande
                                </p>
                            </div>
                            </div>

                            <div className="mt-4 border-t border-white/10 pt-4">
                                {session ? (
                                    <div className="flex flex-wrap items-end gap-3">
                                    <form action={createCheckoutOrderAction} className="flex flex-wrap items-end gap-3">
                                        <input type="hidden" name="ticketTypeId" value={ticketType.id} />

                                        <div>
                                        <label className="mb-2 block text-xs text-white/50">Quantité</label>
                                        <input
                                            name="quantity"
                                            type="number"
                                            min={1}
                                            max={ticketType.maxPerOrder ?? 10}
                                            defaultValue={1}
                                            className="w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none"
                                        />
                                        </div>

                                        <button
                                        type="submit"
                                        className="rounded-xl bg-orange-500 px-4 py-2 font-medium text-black transition hover:bg-orange-400"
                                        >
                                        Acheter
                                        </button>
                                    </form>

                                    {ticketType.isReservable ? (
                                        <form action={createReservationAction} className="flex flex-wrap items-end gap-3">
                                        <input type="hidden" name="ticketTypeId" value={ticketType.id} />

                                        <div>
                                            <label className="mb-2 block text-xs text-white/50">Quantité</label>
                                            <input
                                            name="quantity"
                                            type="number"
                                            min={1}
                                            max={ticketType.maxPerOrder ?? 10}
                                            defaultValue={1}
                                            className="w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
                                        >
                                            Réserver
                                        </button>
                                        </form>
                                    ) : null}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm text-white/60">
                                        Connecte-toi pour acheter ou réserver ce billet.
                                    </p>
                                    <a
                                        href="/login"
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                                    >
                                        Se connecter
                                    </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        ))}

                    {occurrence.ticketTypes.length === 0 ? (
                      <p className="text-sm text-white/50">
                        Aucun billet actif pour cette date.
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

              {event.occurrences.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
                  Aucune date publiée pour cet événement.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}