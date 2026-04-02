import Link from "next/link";
import { formatEventDate } from "@/lib/formatters";
import { getGuestOrderTickets } from "@/server/queries/guest-tickets";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    mode?: string;
    orderId?: string;
    email?: string;
    emailSent?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const mode = params.mode === "reserve" ? "reserve" : "buy";
  const orderId = params.orderId ?? "";
  const email = params.email ?? "";
  const emailSent = params.emailSent === "1";
  const guestOrder = orderId && email ? await getGuestOrderTickets(orderId, email) : null;

  return (
    <main className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-black">
              ✓
            </div>
          </div>

          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-[#FF6B00]">
            Confirmation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {mode === "buy"
              ? "Paiement simulé avec succès"
              : "Acompte simulé avec succès"}
          </h1>

          <p className="mt-4 text-white/70">
            {mode === "buy"
              ? "Votre commande a été enregistrée. Vous pouvez récupérer vos billets immédiatement."
              : "Votre réservation a bien été enregistrée. Vous pouvez récupérer vos justificatifs immédiatement."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href={mode === "buy" ? "/account/tickets" : "/account/reservations"}
              className="rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-5 py-3 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
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

          {guestOrder ? (
            <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
              <p className="text-sm uppercase tracking-[0.2em] text-[#FF6B00]">
                Billets invités
              </p>
              <p className="mt-2 text-sm text-white/70">
                Commande {guestOrder.id} · {guestOrder.customerEmail}
              </p>
              <p className="mt-2 text-xs text-white/60">
                {emailSent
                  ? "Un email contenant vos billets vient d’être envoyé."
                  : "Email non envoyé (SMTP non configuré). Utilisez les téléchargements ci-dessous."}
              </p>

              <div className="mt-4 space-y-3">
                {guestOrder.items.flatMap((item) =>
                  item.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="font-medium text-white">
                        {item.occurrence.event.title} · {item.ticketType.name}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        {formatEventDate(item.occurrence.startsAt)} · {item.occurrence.venue.name}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        N° billet: {ticket.serialNumber}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={`/api/tickets/download?ticketId=${encodeURIComponent(ticket.id)}&orderId=${encodeURIComponent(guestOrder.id)}&email=${encodeURIComponent(guestOrder.customerEmail)}`}
                          className="rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-3 py-2 text-xs font-medium text-black transition hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        >
                          Télécharger billet
                        </a>
                      </div>
                    </div>
                  )),
                )}
              </div>
            </section>
          ) : null}

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