import { notFound } from "next/navigation";
import { formatEventDate, formatXof } from "@/lib/formatters";
import { getPublishedEventBySlug } from "@/server/queries/catalog";
import { CheckoutLinkActions } from "@/features/checkout/components/checkout-link-actions";
import { EventPromoVideo } from "@/features/events/components/event-promo-video";

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

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const mediaAssets = event.mediaAssets ?? [];
  const imageAssets = mediaAssets.filter((asset) => asset.mediaType === "IMAGE");
  const videoAssets = mediaAssets.filter((asset) => asset.mediaType === "VIDEO");

  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
      <section className="border-b border-border/70">
        <div className="relative z-10 section-shell py-12">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="surface-card overflow-hidden">
                {event.coverImageUrl ? (
                  <img
                    src={event.coverImageUrl}
                    alt={event.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center text-foreground/40">
                    Image à venir
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="eyebrow">
                {event.category?.name ?? "Événement"}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                {event.title}
              </h1>
              <p className="text-muted mt-4">
                {event.shortDescription ?? event.fullDescription ?? "Description à venir."}
              </p>

              <div className="surface-card mt-8 space-y-3 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                    Organisateur
                  </p>
                  <p className="mt-1 text-lg font-medium">{event.agency.name}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                    Dates disponibles
                  </p>
                  <p className="mt-1 text-lg font-medium">
                    {event.occurrences.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                    À partir de
                  </p>
                  <p className="mt-1 text-lg font-medium">
                    {formatXof(
                      event.occurrences.flatMap((o) =>
                        o.ticketTypes.map((t) => t.priceAmount),
                      ).length
                        ? Math.min(
                            ...event.occurrences.flatMap((o) =>
                              o.ticketTypes.map((t) => t.priceAmount),
                            ),
                          )
                        : null,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative section-shell py-12">
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            {mediaAssets.length > 0 ? (
              <section className="mb-10">
                <p className="eyebrow">
                  Médias
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Galerie événement</h2>

                <div className="mt-5 grid gap-4">
                  {videoAssets.map((asset) => {
                    const embedUrl = buildVideoEmbedUrl(asset.url);

                    return (
                      <div
                        key={asset.id}
                        className="surface-card overflow-hidden"
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
                      </div>
                    );
                  })}

                  {imageAssets.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {imageAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="surface-card overflow-hidden"
                        >
                          <img
                            src={asset.url}
                            alt={asset.altText ?? event.title}
                            className="aspect-[16/10] w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <p className="eyebrow">
              À propos
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Description</h2>
            <p className="text-muted mt-5 whitespace-pre-line">
              {event.fullDescription ?? event.shortDescription ?? "Description à venir."}
            </p>

            {/* Nouveau bloc Vidéo Promo */}
            {event.promoVideoUrl ? (
              <div className="mt-10">
                <EventPromoVideo
                  url={event.promoVideoUrl}
                  title={event.title}
                />
              </div>
            ) : null}
          </div>

          <div>
            <p className="eyebrow">
              Billetterie
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Dates & billets</h2>

            <div className="mt-6 space-y-6">
              {event.occurrences.map((occurrence) => (
                <div
                  key={occurrence.id}
                  className="surface-card p-6"
                >
                  <div className="mb-5 space-y-2">
                    <h3 className="text-xl font-semibold">
                      {occurrence.title ?? "Occurrence"}
                    </h3>
                    <p className="text-foreground/70">
                      {formatEventDate(occurrence.startsAt)}
                    </p>
                    <p className="text-foreground/70">
                      {occurrence.venue.name}
                      {occurrence.venue.district
                        ? ` · ${occurrence.venue.district}`
                        : ""}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {occurrence.ticketTypes.map((ticketType) => (
                        <div
                            key={ticketType.id}
                            className="rounded-2xl border border-border/80 bg-muted/55 p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-lg font-medium">{ticketType.name}</p>
                                {ticketType.description ? (
                                <p className="mt-1 text-sm text-foreground/60">
                                    {ticketType.description}
                                </p>
                                ) : null}

                                {ticketType.isReservable &&
                                ticketType.reservationPolicy?.isEnabled ? (
                                <p className="mt-3 text-xs text-primary/85">
                                    Réservable avec acompte de{" "}
                                    {ticketType.reservationPolicy.depositPercent ?? 0}%
                                </p>
                                ) : null}
                            </div>

                            <div className="text-right">
                                <p className="text-lg font-semibold">
                                {formatXof(ticketType.priceAmount)}
                                </p>
                                <p className="mt-1 text-xs text-foreground/50">
                                max {ticketType.maxPerOrder ?? "—"} / commande
                                </p>
                            </div>
                            </div>

                            <div className="mt-4 border-t border-border/70 pt-4">
                              <CheckoutLinkActions
                                ticketTypeId={ticketType.id}
                                maxPerOrder={ticketType.maxPerOrder ?? 10}
                                canReserve={
                                  ticketType.isReservable &&
                                  ticketType.reservationPolicy?.isEnabled === true
                                }
                              />
                              <p className="mt-3 text-xs text-foreground/55">
                                Achat express sans compte obligatoire.
                              </p>
                            </div>
                        </div>
                        ))}

                    {occurrence.ticketTypes.length === 0 ? (
                      <p className="text-sm text-foreground/50">
                        Aucun billet actif pour cette date.
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}

              {event.occurrences.length === 0 ? (
                <div className="surface-card p-6 text-foreground/60">
                  Aucune date publiée pour cet événement.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}