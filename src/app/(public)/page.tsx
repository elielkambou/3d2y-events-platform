import Link from "next/link";
import { EventCard } from "@/features/events/components/event-card";
import { getHomepageData } from "@/server/queries/catalog";

export default async function HomePage() {
  const { featuredEvents, categories } = await getHomepageData();

  return (
    <main className="min-h-screen bg-[#0A0A0C] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
            3D2Y Events
          </p>

          <div className="mt-6 max-w-4xl">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              La plateforme premium pour découvrir les meilleures sorties à Abidjan.
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/70">
              Concerts, nightlife, gastronomie, culture. Une expérience visuelle
              premium pour découvrir, réserver et vivre les meilleurs événements.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-5 py-3 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
              >
                Explorer les événements
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-[#FF6B00]/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] bg-clip-text text-transparent">
              Catégories
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Explorer par univers
            </h2>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/explore?category=${encodeURIComponent(category.slug)}`}
              className="rounded-full border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-[#FF6B00]/5 px-4 py-2 text-sm text-white/80 transition hover:shadow-[0_0_20px_rgba(139,92,246,0.18)]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] bg-clip-text text-transparent">
              Sélection
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Événements en vedette
            </h2>
          </div>

          <Link
            href="/explore"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Voir tout
          </Link>
        </div>

        {featuredEvents.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
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