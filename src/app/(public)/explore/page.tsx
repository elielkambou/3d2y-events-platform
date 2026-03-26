import { EventCard } from "@/features/events/components/event-card";
import { getPublishedEvents } from "@/server/queries/catalog";

type ExplorePageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : null;
  const events = await getPublishedEvents();
  const filteredEvents = category
    ? events.filter((event) => event.category?.slug === category)
    : events;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0C] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,107,0,0.18),transparent_55%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.25em] bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] bg-clip-text text-transparent">
          Explore
        </p>
        <h1 className="mt-3 text-4xl font-semibold bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] bg-clip-text text-transparent">
          {category ? `Catégorie : ${category}` : "Tous les événements publiés"}
        </h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Découvre les prochains événements disponibles sur la plateforme.
        </p>

        <div className="mt-10">
          {filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60 backdrop-blur-xl">
              Aucun événement disponible pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}