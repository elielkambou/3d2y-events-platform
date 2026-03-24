import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext, getAdminSubmittedEvents } from "@/server/queries/admin";

export default async function AdminPage() {
  const context = await getAdminContext();

  if (!context) {
    redirect("/login");
  }

  const data = await getAdminSubmittedEvents();

  const total = data?.events.length ?? 0;
  const submitted =
    data?.events.filter((event) => event.status === "SUBMITTED").length ?? 0;
  const approved =
    data?.events.filter((event) => event.status === "APPROVED").length ?? 0;
  const rejected =
    data?.events.filter((event) => event.status === "REJECTED").length ?? 0;

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Dashboard
      </p>

      <h2 className="mt-3 text-3xl font-semibold">
        Bonjour {context.user.fullName ?? context.user.email}
      </h2>

      <p className="mt-4 max-w-2xl text-white/70">
        Centre de pilotage de la plateforme : validation des événements, suivi
        des commandes et remboursements.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">À traiter</p>
          <p className="mt-2 text-3xl font-semibold">{total}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Soumis</p>
          <p className="mt-2 text-3xl font-semibold">{submitted}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Approuvés</p>
          <p className="mt-2 text-3xl font-semibold">{approved}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Rejetés</p>
          <p className="mt-2 text-3xl font-semibold">{rejected}</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/events"
          className="inline-flex rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400"
        >
          Ouvrir la file de validation
        </Link>

        <Link
          href="/admin/orders"
          className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
        >
          Voir les commandes
        </Link>

        <Link
          href="/admin/refunds"
          className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
        >
          Voir les remboursements
        </Link>
      </div>
    </section>
  );
}