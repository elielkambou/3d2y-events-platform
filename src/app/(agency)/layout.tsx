import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { SectionNav } from "@/components/layout/section-nav";
import { getSession } from "@/lib/auth/session";
import { canAccessAgency, canManageAgency } from "@/lib/permissions";
import Link from "next/link";

export default async function AgencyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!canAccessAgency(session)) {
    redirect("/login");
  }

  const agencyNav = [
    {
      href: "/agency",
      label: "Vue d’ensemble",
      description: "Accueil du portail agence",
    },
    ...(canManageAgency(session)
      ? [
          {
            href: "/agency/events",
            label: "Mes événements",
            description: "Brouillons, soumis, publiés",
          },
          {
            href: "/agency/events/new",
            label: "Créer un événement",
            description: "Nouvelle fiche événement",
          },
          {
            href: "/agency/analytics",
            label: "Analytics",
            description: "Ventes, billets, net agence",
          },
          {
            href: "/agency/profile",
            label: "Profil agence",
            description: "Informations publiques et contact",
          },
                  ]
      : []),
    {
      href: "/agency/scanner",
      label: "Scanner",
      description: "Contrôle d’entrée",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0C] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-orange-400">
              3D2Y Events
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Portail agence</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Retour au site
            </Link>

            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <SectionNav title="Agence" items={agencyNav} />
        <div>{children}</div>
      </div>
    </main>
  );
}