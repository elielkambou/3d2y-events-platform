"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(formData: FormData) {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Inscription impossible");
      }

      toast.success("Compte créé avec succès");
      router.push(data.redirectTo ?? "/account");
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
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Inscription
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Créer un compte client</h1>
        <p className="mt-4 text-white/70">
          Inscription locale pour préparer la vraie authentification.
        </p>

        <form action={handleRegister} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-white/70">Nom complet</label>
            <input
              name="fullName"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
            />
          </div>

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
            <label className="mb-2 block text-sm text-white/70">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Confirmer le mot de passe
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400 disabled:opacity-60"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-sm text-white/60">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-orange-300 hover:text-orange-200">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}