import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { SectionNav } from "@/components/layout/section-nav";
import { getSession } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/permissions";
import Link from "next/link";

const adminNav = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Vue d’ensemble admin",
  },
  {
    href: "/admin/events",
    label: "Validation événements",
    description: "Soumis, approuvés, rejetés",
  },
  {
    href: "/admin/orders",
    label: "Commandes",
    description: "Vue finance plateforme",
  },
  {
    href: "/admin/refunds",
    label: "Remboursements",
    description: "Historique des remboursements",
  },
  {
  href: "/admin/deletion-requests",
  label: "Demandes suppression",
  description: "Validation des retraits d’événements",
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!canAccessAdmin(session)) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#0A0A0C] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-orange-400">
              3D2Y Events
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Administration</h1>
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
        <SectionNav title="Admin" items={adminNav} />
        <div>{children}</div>
      </div>
    </main>
  );
}