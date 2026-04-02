import { notFound, redirect } from "next/navigation";
import {
  approveEventAction,
  publishApprovedEventAction,
  rejectEventAction,
} from "@/server/actions/admin-events";
import { adminDeleteEventAction } from "@/server/actions/event-deletion";
import { getAdminEventById } from "@/server/queries/admin";
import { canAccessAdmin } from "@/lib/permissions";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { MinLengthTextarea } from "@/components/forms/min-length-textarea";

function buildVideoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

type AdminEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function getStatusLabel(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "Soumis";
    case "UNDER_REVIEW":
      return "En revue";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "PUBLISHED":
      return "Publié";
    default:
      return status;
  }
}

export default async function AdminEventDetailPage({
  params,
}: AdminEventDetailPageProps) {
  const { eventId } = await params;
  const data = await getAdminEventById(eventId);

  if (!canAccessAdmin(data?.context.session ?? null)) {
    redirect("/login");
  }

  if (!data?.event) {
    notFound();
  }

  const event = data.event;
  const canDecide = event.status === "SUBMITTED" || event.status === "UNDER_REVIEW";
  const isPublished = event.status === "PUBLISHED";
  const imageAssets = event.mediaAssets.filter((asset) => asset.mediaType === "IMAGE");
  const videoAssets = event.mediaAssets.filter((asset) => asset.mediaType === "VIDEO");

  return (
    <main className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {getStatusLabel(event.status)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {event.agency.name}
              </span>
              {isPublished ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
                  Publié
                  {event.publishedAt
                    ? ` · ${event.publishedAt.toLocaleString("fr-FR")}`
                    : ""}
                </span>
              ) : null}
              {event.category ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  {event.category.name}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-4xl font-semibold">{event.title}</h1>
            <p className="mt-4 text-white/70">
              {event.shortDescription ?? "Description à venir."}
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {event.coverImageUrl ? (
                <img
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center text-white/40">
                  Image à venir
                </div>
              )}
            </div>

            {event.mediaAssets.length > 0 ? (
              <section className="mt-10">
                <h2 className="text-2xl font-semibold">Médias agence</h2>

                <div className="mt-6 grid gap-4">
                  {videoAssets.map((asset) => {
                    const embedUrl = buildVideoEmbedUrl(asset.url);

                    return (
                      <div
                        key={asset.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
                      >
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={asset.altText ?? `Video ${asset.id}`}
                            className="aspect-video w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            className="aspect-video w-full object-cover"
                            controls
                            preload="metadata"
                            poster={asset.posterUrl ?? undefined}
                            src={asset.url}
                          />
                        )}
                        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
                          VIDEO · {asset.provider ?? "DIRECT"}
                        </div>
                      </div>
                    );
                  })}

                  {imageAssets.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {imageAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
                        >
                          <img
                            src={asset.url}
                            alt={asset.altText ?? event.title}
                            className="aspect-[16/10] w-full object-cover"
                          />
                          <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
                            IMAGE
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Description complète</h2>
              <p className="mt-5 whitespace-pre-line text-white/75">
                {event.fullDescription ?? "Description à venir."}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Occurrences & billets</h2>

              <div className="mt-6 space-y-6">
                {event.occurrences.map((occurrence) => (
                  <div
                    key={occurrence.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  >
                    <h3 className="text-xl font-semibold">
                      {occurrence.title ?? "Occurrence"}
                    </h3>
                    <p className="mt-2 text-white/70">
                      {formatEventDate(occurrence.startsAt.toISOString())}
                    </p>
                    <p className="mt-1 text-white/70">
                      {occurrence.venue.name}
                      {occurrence.venue.district
                        ? ` · ${occurrence.venue.district}`
                        : ""}
                    </p>
                    <p className="mt-1 text-white/50">
                      Capacité : {occurrence.capacity ?? "—"}
                    </p>

                    <div className="mt-5 space-y-3">
                      {occurrence.ticketTypes.map((ticketType) => (
                        <div
                          key={ticketType.id}
                          className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-[#FF6B00]/5 p-4 backdrop-blur-xl"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-medium">{ticketType.name}</p>
                              {ticketType.description ? (
                                <p className="mt-1 text-sm text-white/60">
                                  {ticketType.description}
                                </p>
                              ) : null}
                              {ticketType.isReservable &&
                              ticketType.reservationPolicy?.isEnabled ? (
                                <p className="mt-2 text-xs text-[#FF6B00]/80">
                                  Réservation activée · acompte{" "}
                                  {ticketType.reservationPolicy.depositPercent
                                    ? Number(ticketType.reservationPolicy.depositPercent)
                                    : 0}
                                  %
                                </p>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                {formatXof(Number(ticketType.priceAmount))}
                              </p>
                              <p className="mt-1 text-xs text-white/50">
                                {ticketType.totalStock} places
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Historique validation</h2>

              <div className="mt-6 space-y-4">
                {isPublished ? (
                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                    <p className="text-sm text-emerald-200/80">
                      {event.publishedAt
                        ? event.publishedAt.toLocaleString("fr-FR")
                        : "Date inconnue"}
                    </p>
                    <p className="mt-2 text-lg font-medium text-emerald-100">
                      PUBLISHED
                    </p>
                    <p className="mt-1 text-sm text-emerald-200/80">
                      L’événement est publié et visible dans le catalogue.
                    </p>
                  </div>
                ) : null}
                {event.approvals.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
                    Aucun historique.
                  </div>
                ) : (
                  event.approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <p className="text-sm text-white/50">
                        {approval.createdAt.toLocaleString("fr-FR")}
                      </p>
                      <p className="mt-2 text-lg font-medium">
                        {approval.status}
                      </p>
                      <p className="mt-1 text-sm text-white/60">
                        {approval.reviewedBy?.email ?? "Système / non assigné"}
                      </p>
                      {approval.comment ? (
                        <p className="mt-3 text-white/75">{approval.comment}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div>
            <div className="sticky top-6 space-y-6">
              {canDecide ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#FF6B00]">
                    Décision admin
                  </p>
                  <p className="mt-3 text-white/70">
                    Analyse la fiche, les dates, la billetterie et décide du statut.
                  </p>

                  <ConfirmActionForm
                    action={approveEventAction}
                    confirmMessage="Vous allez approuver cet événement. Confirmer ?"
                    className="mt-6 space-y-3"
                  >
                    <input type="hidden" name="eventId" value={event.id} />
                    <textarea
                      name="comment"
                      rows={4}
                      placeholder="Commentaire d’approbation"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-black transition hover:bg-emerald-400"
                    >
                      Approuver
                    </button>
                  </ConfirmActionForm>

                  <ConfirmActionForm
                    action={rejectEventAction}
                    confirmMessage="Vous allez rejeter cet événement. Confirmer ?"
                    className="mt-4 space-y-3"
                  >
                    <input type="hidden" name="eventId" value={event.id} />
                    <textarea
                      name="comment"
                      rows={4}
                      placeholder="Motif de rejet"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-red-500 px-5 py-3 font-medium text-white transition hover:bg-red-400"
                    >
                      Rejeter
                    </button>
                  </ConfirmActionForm>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#FF6B00]">
                    Décision admin
                  </p>
                  <p className="mt-3">
                    Décision indisponible : l’événement est déjà{" "}
                    <span className="font-medium text-white">{getStatusLabel(event.status)}</span>.
                  </p>
                </div>
              )}

              {!isPublished ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#FF6B00]">
                    Publication
                  </p>
                  <p className="mt-3 text-white/70">
                    La publication active l’événement dans le catalogue public.
                  </p>

                  <ConfirmActionForm
                    action={publishApprovedEventAction}
                    confirmMessage="Vous allez publier cet événement. Confirmer ?"
                    className="mt-6"
                  >
                    <input type="hidden" name="eventId" value={event.id} />
                    <button
                      type="submit"
                      disabled={event.status !== "APPROVED"}
                      className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-5 py-3 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Publier l’événement
                    </button>
                  </ConfirmActionForm>

                  {event.status !== "APPROVED" ? (
                    <p className="mt-3 text-xs text-white/50">
                      L’événement doit être approuvé avant publication.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-emerald-100">
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">
                    Publication
                  </p>
                  <p className="mt-3">
                    Déjà publié{event.publishedAt ? ` le ${event.publishedAt.toLocaleString("fr-FR")}` : ""}.
                  </p>
                </div>
              )}

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
                  Suppression admin
                </p>
                <p className="mt-3 text-white/70">
                  Retire immédiatement l’événement de la plateforme.
                </p>

                <form action={adminDeleteEventAction} className="mt-6 space-y-3">
                  <input type="hidden" name="eventId" value={event.id} />
                  <MinLengthTextarea
                    name="reason"
                    rows={4}
                    minChars={10}
                    placeholder="Motif interne de suppression"
                  />
                  <button
                    type="submit"
                    disabled={event.isDeleted}
                    className="w-full rounded-2xl bg-red-500 px-5 py-3 font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Supprimer l’événement
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}