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
    minPrice: number | null;
    currency: string;
  };
};

export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_0_25px_rgba(255,107,0,0.12)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40">
            Image à venir
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-[#0A0A0C]/35 to-transparent" />

        <div className="absolute left-4 top-4 flex gap-2">
          {event.category ? (
            <span className="rounded-full border border-white/10 bg-[#0A0A0C]/60 px-3 py-1 text-xs text-white backdrop-blur">
              {event.category.name}
            </span>
          ) : null}

          {event.isFeatured ? (
            <span className="rounded-full bg-gradient-to-br from-[#FF6B00] to-[#8B5CF6] px-3 py-1 text-xs font-medium text-white">
              En vedette
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            {event.agency.name}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="line-clamp-2 text-sm text-white/70">
          {event.shortDescription ?? "Description à venir."}
        </p>

        {event.firstOccurrence ? (
          <div className="space-y-1 text-sm text-white/70">
            <p>{formatEventDate(event.firstOccurrence.startsAt)}</p>
            <p>
              {event.firstOccurrence.venueName}
              {event.firstOccurrence.district
                ? ` · ${event.firstOccurrence.district}`
                : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/50">Date à confirmer</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-white/50">À partir de</span>
          <span className="text-lg font-semibold text-white">
            {formatXof(event.minPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}