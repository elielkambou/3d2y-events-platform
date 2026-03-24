import { redirect } from "next/navigation";
import { createAgencyEventAction } from "@/server/actions/agency-events";
import { getSession } from "@/lib/auth/session";
import { canAccessAgency } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";

export default async function NewAgencyEventPage() {
  const session = await getSession();

  if (!canAccessAgency(session)) {
    redirect("/login");
  }

  const [categories, venues] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.venue.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Agence
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Créer un événement</h1>
        <p className="mt-4 text-white/70">
          Version V1 : une fiche, une date, un billet principal.
        </p>

        <form action={createAgencyEventAction} className="mt-10 space-y-8">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Informations principales</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">Titre</label>
                <input
                  name="title"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">Slug</label>
                <input
                  name="slug"
                  required
                  placeholder="festival-zone-4-2026"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Catégorie</label>
                <select
                  name="categoryId"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                >
                  <option value="">Choisir</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  URL image couverture
                </label>
                <input
                  name="coverImageUrl"
                  type="url"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Description courte
                </label>
                <textarea
                  name="shortDescription"
                  required
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Description complète
                </label>
                <textarea
                  name="fullDescription"
                  required
                  rows={6}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Occurrence principale</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">Lieu</label>
                <select
                  name="venueId"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                >
                  <option value="">Choisir</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Début</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Fin</label>
                <input
                  name="endsAt"
                  type="datetime-local"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Début ventes
                </label>
                <input
                  name="salesStartAt"
                  type="datetime-local"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Fin ventes
                </label>
                <input
                  name="salesEndAt"
                  type="datetime-local"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Fin réservation
                </label>
                <input
                  name="reservationEndAt"
                  type="datetime-local"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Capacité</label>
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Billet principal</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Nom du billet
                </label>
                <input
                  name="ticketName"
                  required
                  defaultValue="Standard"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Prix</label>
                <input
                  name="ticketPriceAmount"
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Description du billet
                </label>
                <input
                  name="ticketDescription"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Stock</label>
                <input
                  name="ticketTotalStock"
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Max / commande
                </label>
                <input
                  name="ticketMaxPerOrder"
                  type="number"
                  min={1}
                  required
                  defaultValue={4}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 text-sm text-white/80">
                  <input type="checkbox" name="isReservable" />
                  Autoriser la réservation avec acompte
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Acompte %
                </label>
                <input
                  name="depositPercent"
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Grâce (heures)
                </label>
                <input
                  name="gracePeriodHours"
                  type="number"
                  min={0}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-orange-500 px-6 py-3 font-medium text-black transition hover:bg-orange-400"
            >
              Créer et soumettre
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}