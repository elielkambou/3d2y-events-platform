import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function DevPage() {
  const [users, agencies, categories, venues, events, occurrences, ticketTypes] =
    await Promise.all([
      prisma.user.count(),
      prisma.agency.count(),
      prisma.category.count(),
      prisma.venue.count(),
      prisma.event.count(),
      prisma.eventOccurrence.count(),
      prisma.ticketType.count(),
    ]);

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-semibold">Dev Database Check</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Users</p>
            <p className="text-2xl font-bold">{users}</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Agencies</p>
            <p className="text-2xl font-bold">{agencies}</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Categories</p>
            <p className="text-2xl font-bold">{categories}</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Venues</p>
            <p className="text-2xl font-bold">{venues}</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Events</p>
            <p className="text-2xl font-bold">{events}</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Occurrences</p>
            <p className="text-2xl font-bold">{occurrences}</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Ticket Types</p>
            <p className="text-2xl font-bold">{ticketTypes}</p>
          </div>
        </div>
      </div>
    </main>
  );
}