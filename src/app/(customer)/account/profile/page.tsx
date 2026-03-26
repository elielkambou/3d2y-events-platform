import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { updateUserProfileAction } from "@/server/actions/profile";

type AccountProfilePageProps = {
  searchParams: Promise<{
    updated?: string;
  }>;
};

export default async function AccountProfilePage({
  searchParams,
}: AccountProfilePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const updated = params.updated === "1";

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Profil
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Mon profil</h2>

      <p className="mt-4 text-white/70">
        Modifie tes informations personnelles utilisées dans tes commandes et billets.
      </p>

      {updated ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
          Profil mis à jour avec succès.
        </div>
      ) : null}

      <form action={updateUserProfileAction} className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="mb-2 block text-sm text-white/70">Nom complet</label>
          <input
            name="fullName"
            defaultValue={user.fullName ?? ""}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Email</label>
          <input
            value={user.email}
            disabled
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/50 outline-none"
          />
          <p className="mt-2 text-xs text-white/50">
            L’email n’est pas éditable dans cette version.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Téléphone</label>
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">URL avatar</label>
          <input
            name="avatarUrl"
            type="url"
            defaultValue={user.avatarUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400"
        >
          Enregistrer
        </button>
      </form>
    </section>
  );
}