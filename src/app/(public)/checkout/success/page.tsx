import Link from "next/link";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const mode = params.mode === "reserve" ? "reserve" : "buy";

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-black">
              ✓
            </div>
          </div>

          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-orange-400">
            Confirmation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {mode === "buy"
              ? "Paiement simulé avec succès"
              : "Acompte simulé avec succès"}
          </h1>

          <p className="mt-4 text-white/70">
            {mode === "buy"
              ? "Votre commande a été enregistrée et vos billets sont disponibles dans votre espace client."
              : "Votre réservation a bien été enregistrée. Le solde pourra être réglé plus tard depuis votre espace client."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href={mode === "buy" ? "/account/tickets" : "/account/reservations"}
              className="rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400"
            >
              {mode === "buy" ? "Voir mes billets" : "Voir mes réservations"}
            </Link>

            <Link
              href="/explore"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Retour à l’explore
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-sm text-white/60">
            <p className="font-medium text-white/80">Mode démonstration</p>
            <p className="mt-2">
              Aucun paiement réel n’a été effectué. Cette page simule le comportement
              d’une passerelle de paiement externe.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}