import Link from "next/link";
import { EventCard } from "@/features/events/components/event-card";
import { getHomepageData } from "@/server/queries/catalog";

export default async function HomePage() {
  const { featuredEvents, categories } = await getHomepageData();

  return (
    <main className="min-h-screen text-foreground">
      <section className="border-b border-border/70">
        <div className="section-shell py-18 sm:py-20">
          <p className="eyebrow">3D2Y Events</p>
          <div className="mt-6 max-w-4xl">
            <h1 className="heading-display sm:text-6xl">
              La plateforme qui fait vibrer Abidjan, entre découvertes, sorties
              et expériences inoubliables.
            </h1>

            <p className="text-muted mt-6 max-w-2xl text-lg">
              Concerts, nightlife, gastronomie, culture. Une expérience moderne,
              lumineuse et chaleureuse pour découvrir, réserver et vivre les
              meilleurs événements.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/explore" className="btn-primary">
                Explorer les événements
              </Link>
              <Link href="/login" className="btn-secondary">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Catégories</p>
            <h2 className="mt-2 text-2xl font-semibold">Explorer par univers</h2>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/explore?category=${encodeURIComponent(category.slug)}`}
              className="rounded-full border border-border/80 bg-card/90 px-4 py-2 text-sm text-foreground/75 transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Sélection</p>
            <h2 className="mt-2 text-2xl font-semibold">Événements en vedette</h2>
          </div>

          <Link href="/explore" className="text-sm text-foreground/70 transition hover:text-primary">
            Voir tout
          </Link>
        </div>

        {featuredEvents.length === 0 ? (
          <div className="surface-card p-8 text-foreground/60">
            Aucun événement publié pour le moment.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}