import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canAccessScanner } from "@/lib/permissions";
import { QrScanner } from "@/features/tickets/components/qr-scanner";

export default async function AgencyScannerPage() {
  const session = await getSession();

  if (!canAccessScanner(session)) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Scanner
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Contrôle des billets</h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Vérifie les QR codes à l’entrée et bloque automatiquement les doubles scans.
        </p>

        <div className="mt-10">
          <QrScanner />
        </div>
      </div>
    </main>
  );
}