import { redirect } from "next/navigation";
import { getCurrentAgencyContext } from "@/server/queries/agency";
import { updateAgencyProfileAction } from "@/server/actions/profile";

type AgencyProfilePageProps = {
  searchParams: Promise<{
    updated?: string;
  }>;
};

export default async function AgencyProfilePage({
  searchParams,
}: AgencyProfilePageProps) {
  const context = await getCurrentAgencyContext();

  if (!context) {
    redirect("/login");
  }

  const params = await searchParams;
  const updated = params.updated === "1";

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
        Profil agence
      </p>

      <h2 className="mt-3 text-3xl font-semibold">{context.agency.name}</h2>

      <p className="mt-4 text-white/70">
        Mets à jour les informations publiques et de contact de ton agence.
      </p>

      {updated ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
          Profil agence mis à jour avec succès.
        </div>
      ) : null}

      <form action={updateAgencyProfileAction} className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="mb-2 block text-sm text-white/70">Nom de l’agence</label>
          <input
            name="name"
            defaultValue={context.agency.name}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Email agence</label>
          <input
            name="email"
            type="email"
            defaultValue={context.agency.email}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Téléphone</label>
          <input
            name="phone"
            defaultValue={context.agency.phone ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Description</label>
          <textarea
            name="description"
            rows={6}
            defaultValue={context.agency.description ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">URL logo</label>
          <input
            name="logoUrl"
            type="url"
            defaultValue={context.agency.logoUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">URL image de couverture</label>
          <input
            name="coverImageUrl"
            type="url"
            defaultValue={context.agency.coverImageUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Slug</label>
          <input
            value={context.agency.slug}
            disabled
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/50 outline-none"
          />
          <p className="mt-2 text-xs text-white/50">
            Le slug n’est pas modifiable dans cette version.
          </p>
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