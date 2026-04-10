import { redirect } from "next/navigation";
import { createAgencyEventAction } from "@/server/actions/agency-events";
import { getSession } from "@/lib/auth/session";
import { canAccessAgency } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";
import { WordCountTextarea } from "@/components/forms/WordCountTextarea";
import { EventVideoUpload } from "@/features/events/components/event-video-upload";
import { EventVideoField } from "@/features/events/components/event-video-field";

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
    <main className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
          Agence
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Créer un événement</h1>
        <p className="mt-4 text-white/70">
          Version V1 : une fiche, une date, un billet principal.
        </p>

        <form action={createAgencyEventAction} className="mt-10 space-y-8">
          {/* INFORMATIONS PRINCIPALES */}
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

              {/* Remplacement par le nouveau composant interactif */}
              <EventVideoField />

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  URL image aperçu vidéo (optionnel)
                </label>
                <input
                  name="promoVideoPosterUrl"
                  type="url"
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <WordCountTextarea
                  name="shortDescription"
                  label="Description courte"
                  required
                  rows={3}
                  minWords={5}
                  maxWords={20}
                  placeholder="Résumé accrocheur (5 à 20 mots)."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <WordCountTextarea
                  name="fullDescription"
                  label="Description complète"
                  required
                  rows={6}
                  minWords={50}
                  placeholder="Raconte l’expérience, le programme, les infos pratiques (min 50 mots)."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>
            </div>
          </section>

          {/* OCCURRENCE PRINCIPALE */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Occurrence principale</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">Lieu existant</label>
                <select
                  name="venueId"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                >
                  <option value="">Choisir un lieu existant</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-white/50">
                  Si le lieu n’existe pas encore, laisse vide et complète les champs ci-dessous.
                </p>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-[#FF6B00]/5 p-4 backdrop-blur-xl">
                <p className="text-sm font-medium text-white">Ajouter un nouveau lieu</p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-white/70">Nom du lieu</label>
                    <input
                      name="newVenueName"
                      placeholder="Ex: Rooftop Cocody"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">Quartier</label>
                    <input
                      name="newVenueDistrict"
                      placeholder="Ex: Cocody"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">Commune</label>
                    <input
                      name="newVenueMunicipality"
                      placeholder="Ex: Cocody"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-white/70">Adresse</label>
                    <input
                      name="newVenueAddressLine"
                      placeholder="Ex: Riviera 3, Rue des Jardins"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Début</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  step={60}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Fin</label>
                <input
                  name="endsAt"
                  type="datetime-local"
                  required
                  step={60}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Début ventes</label>
                <input
                  name="salesStartAt"
                  type="datetime-local"
                  required
                  step={60}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Fin ventes</label>
                <input
                  name="salesEndAt"
                  type="datetime-local"
                  required
                  step={60}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Fin réservation</label>
                <input
                  name="reservationEndAt"
                  type="datetime-local"
                  required
                  step={60}
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

          {/* BILLET PRINCIPAL */}
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
                  Activer la réservation avec acompte (optionnel)
                </label>
                <p className="mt-2 text-xs text-white/50">
                  Si cette option n'est pas cochée, seul le bouton "Acheter" sera affiché côté client.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Acompte % (si réservation activée)
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
                  Délai de grâce (heures, si réservation activée)
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
              className="rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-6 py-3 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
            >
              Créer et soumettre
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}