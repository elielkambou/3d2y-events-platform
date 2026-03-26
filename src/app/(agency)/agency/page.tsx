import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAgencyContext } from "@/server/queries/agency";

export default async function AgencyPage() {
  const context = await getCurrentAgencyContext();

  if (!context) {
    redirect("/login");
  }

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Vue d’ensemble
      </p>

      <h2 className="mt-3 text-3xl font-semibold">{context.agency.name}</h2>

      <p className="mt-4 max-w-2xl text-white/70">
        Gère tes événements, suis leur validation, contrôle les billets et
        consulte tes performances.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/agency/events"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Mes événements</p>
          <p className="mt-2 text-sm text-white/60">
            Voir les brouillons, soumissions et événements publiés.
          </p>
        </Link>

        <Link
          href="/agency/events/new"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Créer un événement</p>
          <p className="mt-2 text-sm text-white/60">
            Ajouter une fiche, une date et un billet principal.
          </p>
        </Link>

        <Link
          href="/agency/analytics"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Analytics</p>
          <p className="mt-2 text-sm text-white/60">
            Ventes, billets émis, scans, chiffre brut et net agence.
          </p>
        </Link>

        <Link
          href="/agency/scanner"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Scanner billets</p>
          <p className="mt-2 text-sm text-white/60">
            Contrôle d’entrée, validation et anti double-scan.
          </p>
        </Link>

        <Link
          href="/agency/profile"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Profil agence</p>
          <p className="mt-2 text-sm text-white/60">
            Modifier les informations publiques et de contact.
          </p>
        </Link>
      </div>
    </section>
  );
}