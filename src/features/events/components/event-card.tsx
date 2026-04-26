import Link from "next/link";
import { formatEventDate, formatXof } from "@/lib/formatters";

type EventCardProps = {
  event: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    coverImageUrl: string | null;
    isFeatured: boolean;
    category: {
      name: string;
      slug: string;
    } | null;
    agency: {
      name: string;
      slug: string;
    };
    firstOccurrence: {
      id: string;
      title: string | null;
      startsAt: string;
      venueName: string;
      district: string | null;
      city: string;
    } | null;
    firstTicketType: {
      id: string;
      isReservable: boolean;
    } | null;
    minPrice: number | null;
    currency: string;
  };
};

export function EventCard({ event }: EventCardProps) {
  const quickBuyHref = `/events/${event.slug}`;

  return (
    <article className="surface-card group overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/20">
      <div className="relative aspect-[5/3] overflow-hidden bg-muted/60">
        <Link href={`/events/${event.slug}`} className="block h-full w-full">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground/40">
              Image à venir
            </div>
          )}
        </Link>

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />

        <div className="absolute left-4 top-4 flex gap-2">
          {event.category ? (
            <span className="rounded-full border border-white/35 bg-white/75 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
              {event.category.name}
            </span>
          ) : null}

          {event.isFeatured ? (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              En vedette
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/75">
            {event.agency.name}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-white">{event.title}</h3>
        </div>
      </div>

      <div className="space-y-3 p-3.5">
        <p className="line-clamp-2 text-xs text-foreground/70">
          {event.shortDescription ?? "Description à venir."}
        </p>

        {event.firstOccurrence ? (
          <div className="space-y-1 text-xs text-foreground/70">
            <p>{formatEventDate(event.firstOccurrence.startsAt)}</p>
            <p>
              {event.firstOccurrence.venueName}
              {event.firstOccurrence.district
                ? ` · ${event.firstOccurrence.district}`
                : ""}
            </p>
          </div>
        ) : (
          <p className="text-xs text-foreground/50">Date à confirmer</p>
        )}

        <div className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-1.5">
          <span className="text-xs text-foreground/60">À partir de</span>
          <span className="text-base font-semibold text-foreground">
            {formatXof(event.minPrice)}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Link
            href={quickBuyHref}
            className="btn-primary flex-1 px-3 py-1.5 text-xs"
          >
            Acheter
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Détails
          </Link>
        </div>
      </div>
    </article>
  );
}