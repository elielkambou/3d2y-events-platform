"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_USERS = [
  { label: "Super Admin", email: "admin@3d2y.local", redirectTo: "/admin" },
  { label: "Agence", email: "agency@lagune.local", redirectTo: "/agency" },
  { label: "Scanner", email: "scanner@lagune.local", redirectTo: "/agency/scanner" },
  { label: "Client démo", email: "client@test.local", redirectTo: "/account" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingDemoEmail, setLoadingDemoEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextUrl = searchParams.get("next");

  async function loginDemo(email: string, redirectTo: string) {
    try {
      setLoadingDemoEmail(email);

      const response = await fetch("/api/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Connexion démo impossible");
      }

      toast.success("Connexion démo réussie");
      router.push(nextUrl || redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
      );
    } finally {
      setLoadingDemoEmail(null);
    }
  }

  async function handleRealLogin(formData: FormData) {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Connexion impossible");
      }

      toast.success("Connexion réussie");
      router.push(nextUrl || data.redirectTo || "/account");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#FF6B00]">
            Connexion
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Compte utilisateur
          </h1>
          <p className="mt-4 text-white/70">
            Connexion réelle locale par email et mot de passe.
          </p>

          <form
            action={handleRealLogin}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm text-white/70">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-5 py-3 font-medium text-black transition hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] disabled:opacity-60"
            >
              Se connecter
            </button>
          </form>

          <p className="mt-6 text-sm text-white/60">
            Pas encore de compte ?{" "}
            <Link
              href={nextUrl ? `/register?next=${encodeURIComponent(nextUrl)}` : "/register"}
              className="text-[#FF6B00]/80 hover:text-[#FF6B00]"
            >
              Créer un compte
            </Link>
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
            Comptes démo
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Accès rapide de développement
          </h2>
          <p className="mt-4 text-white/70">
            Garde ces accès pour tester rapidement les rôles de la plateforme.
          </p>

          <div className="mt-8 grid gap-4">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                onClick={() => loginDemo(user.email, user.redirectTo)}
                disabled={loadingDemoEmail === user.email}
                className="rounded-2xl border border-white/10 bg-black/30 p-5 text-left transition hover:bg-white/10 disabled:opacity-60"
              >
                <p className="text-lg font-medium">{user.label}</p>
                <p className="mt-1 text-sm text-white/60">{user.email}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}