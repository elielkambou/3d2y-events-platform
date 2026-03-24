"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/logout", {
      method: "POST",
    });

    if (!response.ok) {
      toast.error("Déconnexion impossible");
      return;
    }

    toast.success("Déconnecté");
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
    >
      Déconnexion
    </button>
  );
}