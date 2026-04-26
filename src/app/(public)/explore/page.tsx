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
    <main className="relative min-h-screen overflow-hidden text-foreground">
      <div className="relative z-10 section-shell py-16">
        <p className="eyebrow">Explore</p>
        <h1 className="mt-3 text-4xl font-semibold">
          {category ? `Catégorie : ${category}` : "Tous les événements publiés"}
        </h1>
        <p className="text-muted mt-4 max-w-2xl">
          Découvre les prochains événements disponibles sur la plateforme.
        </p>

        <div className="mt-10">
          {filteredEvents.length === 0 ? (
            <div className="surface-card p-8 text-foreground/60">
              Aucun événement disponible pour le moment.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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