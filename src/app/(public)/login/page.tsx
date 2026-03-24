"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_USERS = [
  { label: "Super Admin", email: "admin@3d2y.local", redirectTo: "/admin" },
  { label: "Agence", email: "agency@lagune.local", redirectTo: "/agency" },
  { label: "Scanner", email: "scanner@lagune.local", redirectTo: "/agency/scanner" },
  { label: "Client", email: "client@test.local", redirectTo: "/account" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  async function login(email: string, redirectTo: string) {
    try {
      setLoadingEmail(email);

      const response = await fetch("/api/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Connexion impossible");
      }

      toast.success("Connexion locale réussie");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
      );
    } finally {
      setLoadingEmail(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.25em] text-orange-400">
          3D2Y Events
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Connexion locale de développement
        </h1>
        <p className="mt-4 text-white/70">
          On utilise des comptes seedés pour avancer vite avant d’intégrer la
          vraie auth.
        </p>

        <div className="mt-10 grid gap-4">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              onClick={() => login(user.email, user.redirectTo)}
              disabled={loadingEmail === user.email}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10 disabled:opacity-60"
            >
              <p className="text-lg font-medium">{user.label}</p>
              <p className="mt-1 text-sm text-white/60">{user.email}</p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}