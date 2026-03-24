import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentUserTickets } from "@/server/queries/tickets";
import { buildTicketQrToken } from "@/lib/ticketing";
import { formatEventDate, formatXof } from "@/lib/formatters";

function getQrUnavailableMessage(status: string) {
  switch (status) {
    case "RESERVED":
      return "Billet réservé : QR indisponible tant que le solde n’est pas payé.";
    case "REFUNDED":
      return "Billet remboursé : QR désactivé.";
    case "CANCELLED":
      return "Billet annulé : QR désactivé.";
    case "EXPIRED":
      return "Billet expiré : QR désactivé.";
    default:
      return "QR indisponible pour ce billet.";
  }
}

export default async function AccountTicketsPage() {
  const data = await getCurrentUserTickets();

  if (!data?.session) {
    redirect("/login");
  }

  const ticketsWithQr = await Promise.all(
    data.tickets.map(async (ticket) => {
      const rawToken = buildTicketQrToken(ticket.id, ticket.serialNumber);
      const qrDataUrl =
        ticket.status === "ISSUED" || ticket.status === "CHECKED_IN"
          ? await QRCode.toDataURL(rawToken)
          : null;

      return {
        ticket,
        qrDataUrl,
        rawToken,
      };
    }),
  );

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Mes billets
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Billets & QR codes</h2>

      <p className="mt-4 text-white/70">
        Billets émis après achat complet ou règlement du solde.
      </p>

      <div className="mt-10 space-y-6">
        {ticketsWithQr.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
            Aucun billet pour le moment.
          </div>
        ) : (
          ticketsWithQr.map(({ ticket, qrDataUrl, rawToken }) => {
            const totalAmount = Number(ticket.orderItem.order.totalAmount);
            const paidAmount = ticket.orderItem.order.payments.reduce(
              (sum, payment) => sum + Number(payment.amount),
              0,
            );
            const remainingAmount = totalAmount - paidAmount;

            return (
              <div
                key={ticket.id}
                className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-[1fr_240px]"
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {ticket.status}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {ticket.ticketType.name}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold">
                    {ticket.occurrence.event.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-white/70">
                    <p>{formatEventDate(ticket.occurrence.startsAt.toISOString())}</p>
                    <p>
                      {ticket.occurrence.venue.name}
                      {ticket.occurrence.venue.district
                        ? ` · ${ticket.occurrence.venue.district}`
                        : ""}
                    </p>
                    <p>Organisateur : {ticket.occurrence.event.agency.name}</p>
                    <p>Référence billet : {ticket.serialNumber}</p>
                    <p>
                      Commande : {ticket.orderItem.order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p>Prix : {formatXof(Number(ticket.orderItem.unitPrice))}</p>

                    {ticket.status === "RESERVED" ? (
                      <>
                        <p>Acompte payé : {formatXof(paidAmount)}</p>
                        <p>Solde restant : {formatXof(remainingAmount)}</p>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="mb-4 text-sm text-white/50">QR de contrôle</p>

                  {qrDataUrl ? (
                    <>
                      <img
                        src={qrDataUrl}
                        alt={`QR billet ${ticket.serialNumber}`}
                        className="w-full rounded-2xl bg-white p-3"
                      />

                      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
                        <p className="text-xs text-white/50">Token de dev</p>
                        <p className="mt-2 break-all text-xs text-white/80">
                          {rawToken}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
                      {getQrUnavailableMessage(ticket.status)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}