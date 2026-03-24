import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <section>
      <h2 className="text-3xl font-semibold">
        {session.fullName ?? session.email}
      </h2>
      <p className="mt-4 text-white/70">
        Commandes, billets et réservations de développement.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Link
          href="/account/tickets"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Mes billets</p>
          <p className="mt-2 text-sm text-white/60">
            Voir les billets émis et leurs QR codes.
          </p>
        </Link>

        <Link
          href="/account/reservations"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-lg font-medium">Mes réservations</p>
          <p className="mt-2 text-sm text-white/60">
            Consulter les acomptes et payer les soldes.
          </p>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-medium">Historique</p>
          <p className="mt-2 text-sm text-white/60">
            On branchera ensuite l’historique complet.
          </p>
        </div>
      </div>
    </section>
  );
}