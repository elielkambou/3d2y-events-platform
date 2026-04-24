import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/80">
      <div className="section-shell flex flex-col gap-4 py-8 text-sm text-foreground/60 md:flex-row md:items-center md:justify-between">
        <p>© 2026 3D2Y Events — Plateforme culturelle et billetterie festive.</p>

        <div className="flex flex-wrap gap-4">
          <Link href="/" className="transition hover:text-primary">
            Accueil
          </Link>
          <Link href="/explore" className="transition hover:text-primary">
            Explore
          </Link>
          <Link href="/login" className="transition hover:text-primary">
            Connexion
          </Link>
        </div>
      </div>
    </footer>
  );
}