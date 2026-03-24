import { EventCard } from "@/features/events/components/event-card";
import { getPublishedEvents } from "@/server/queries/catalog";

export default async function ExplorePage() {
  const events = await getPublishedEvents();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Explore
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Tous les événements publiés</h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Découvre les prochains événements disponibles sur la plateforme.
        </p>

        <div className="mt-10">
          {events.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
              Aucun événement disponible pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}