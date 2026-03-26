import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0C] px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          Cette page n’existe pas
        </h1>
        <p className="mt-4 text-white/70">
          L’événement ou la page demandée est introuvable.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-[#FF6B00] px-5 py-3 font-medium text-black transition hover:bg-[#FF6B00]/90"
        >
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}