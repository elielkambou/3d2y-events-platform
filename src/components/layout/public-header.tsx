import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export async function PublicHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-white/10 bg-[#0A0A0C]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-white">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.25em] bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] bg-clip-text text-transparent"
        >
          3D2Y EVENTS
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-white/75 transition hover:text-white">
            Accueil
          </Link>
          <Link href="/explore" className="text-sm text-white/75 transition hover:text-white">
            Explore
          </Link>
          <Link href="/login" className="text-sm text-white/75 transition hover:text-white">
            Connexion
          </Link>
          <Link href="/register" className="text-sm text-white/75 transition hover:text-white">
            Inscription
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/account"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Mon espace
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-4 py-2 text-sm font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}