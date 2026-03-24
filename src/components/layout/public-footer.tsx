import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
        <p>© 2026 3D2Y Events — Plateforme culturelle & billetterie premium.</p>

        <div className="flex flex-wrap gap-4">
          <Link href="/" className="transition hover:text-white">
            Accueil
          </Link>
          <Link href="/explore" className="transition hover:text-white">
            Explore
          </Link>
          <Link href="/login" className="transition hover:text-white">
            Connexion
          </Link>
        </div>
      </div>
    </footer>
  );
}