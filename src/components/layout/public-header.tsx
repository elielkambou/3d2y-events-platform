import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export async function PublicHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between py-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.25em] text-primary"
        >
          3D2Y EVENTS
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-foreground/75 transition hover:text-foreground">
            Accueil
          </Link>
          <Link href="/explore" className="text-sm text-foreground/75 transition hover:text-foreground">
            Explore
          </Link>
          <Link href="/login" className="text-sm text-foreground/75 transition hover:text-foreground">
            Connexion
          </Link>
          <Link href="/register" className="text-sm text-foreground/75 transition hover:text-foreground">
            Inscription
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/account"
              className="btn-secondary px-4 py-2"
            >
              Mon espace
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-primary px-4 py-2"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}