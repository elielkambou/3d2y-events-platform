"use client";

import { CreditCard, Landmark, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";

type CheckoutFormProps = {
  mode: "buy" | "reserve";
  ticketTypeId: string;
  quantity: number;
  amountDueNow: number;
  remainingAmount: number;
  depositPercent: number;
  action: (formData: FormData) => void | Promise<void>;
};

const paymentMethods = [
  {
    id: "ORANGE_MONEY",
    label: "Orange Money",
    type: "mobile_money",
    hint: "Paiement mobile instantané",
    icon: Smartphone,
    accent: "from-orange-500/20 to-orange-300/5",
  },
  {
    id: "MTN_MOMO",
    label: "MTN Mobile Money",
    type: "mobile_money",
    hint: "Validation rapide par téléphone",
    icon: Smartphone,
    accent: "from-yellow-500/20 to-yellow-300/5",
  },
  {
    id: "MOOV_MONEY",
    label: "Moov Money",
    type: "mobile_money",
    hint: "Paiement mobile sécurisé",
    icon: Smartphone,
    accent: "from-blue-500/20 to-cyan-300/5",
  },
  {
    id: "WAVE",
    label: "Wave",
    type: "mobile_money",
    hint: "Paiement mobile rapide via Wave",
    icon: Smartphone,
    accent: "from-sky-500/20 to-cyan-300/5",
  },
  {
    id: "CARD",
    label: "Carte bancaire",
    type: "card",
    hint: "Visa, Mastercard, débit ou crédit",
    icon: CreditCard,
    accent: "from-violet-500/20 to-fuchsia-300/5",
  },
  {
    id: "CASH",
    label: "Paiement physique agence",
    type: "cash",
    hint: "Validation manuelle ultérieure",
    icon: Landmark,
    accent: "from-white/10 to-white/5",
  },
] as const;

export function CheckoutForm({
  mode,
  ticketTypeId,
  quantity,
  amountDueNow,
  remainingAmount,
  depositPercent,
  action,
}: CheckoutFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("ORANGE_MONEY");

  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileHolder, setMobileHolder] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const [cashFullName, setCashFullName] = useState("");
  const [cashPhone, setCashPhone] = useState("");

  const [acceptOrder, setAcceptOrder] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDemo, setAcceptDemo] = useState(false);

  const selected = useMemo(
    () => paymentMethods.find((method) => method.id === selectedMethod),
    [selectedMethod],
  );

  const isMobileValid =
    mobileNumber.trim().length >= 8 && mobileHolder.trim().length >= 2;

  const isCardValid =
    cardNumber.trim().length >= 12 &&
    cardExpiry.trim().length >= 4 &&
    cardCvc.trim().length >= 3 &&
    cardHolder.trim().length >= 2;

  const isCashValid =
    cashFullName.trim().length >= 2 && cashPhone.trim().length >= 8;

  const isPaymentDetailsValid =
    selected?.type === "mobile_money"
      ? isMobileValid
      : selected?.type === "card"
        ? isCardValid
        : selected?.type === "cash"
          ? isCashValid
          : false;

  const isFormValid =
    isPaymentDetailsValid && acceptOrder && acceptTerms && acceptDemo;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="ticketTypeId" value={ticketTypeId} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="paymentMethod" value={selectedMethod} />
      <input type="hidden" name="paymentLabel" value={selected?.label ?? ""} />

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
            Progression
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-medium text-black">
              1. Paiement
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-white/60">
              2. Validation
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-white/60">
              3. Confirmation
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <p className="font-medium text-emerald-200">Transaction simulée sécurisée</p>
              <p className="mt-1 text-sm text-emerald-100/70">
                Cette interface imite un tunnel de paiement réaliste pour la démo,
                sans encaissement réel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Méthode de paiement
        </p>

        <div className="mt-6 grid gap-4">
          {paymentMethods.map((method) => {
            const active = method.id === selectedMethod;
            const Icon = method.icon;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  active
                    ? "border-orange-400 bg-orange-500/10"
                    : "border-white/10 bg-black/25 hover:bg-white/10"
                }`}
              >
                <div
                  className={`rounded-[1.25rem] bg-gradient-to-br p-4 ${method.accent}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          active ? "bg-orange-500 text-black" : "bg-white/10 text-white"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-base font-medium text-white">{method.label}</p>
                        <p className="mt-1 text-sm text-white/60">{method.hint}</p>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border ${
                        active
                          ? "border-orange-400 bg-orange-400"
                          : "border-white/20"
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Informations de paiement
        </p>

        {selected?.type === "mobile_money" ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Numéro {selected.label}
              </label>
              <input
                name="mobileNumber"
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Nom du titulaire
              </label>
              <input
                name="mobileHolder"
                type="text"
                required
                value={mobileHolder}
                onChange={(e) => setMobileHolder(e.target.value)}
                placeholder="Nom du titulaire"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>
          </div>
        ) : null}

        {selected?.type === "card" ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/70">
                Numéro de carte
              </label>
              <input
                name="cardNumber"
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Expiration</label>
              <input
                name="cardExpiry"
                type="text"
                required
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="08/28"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">CVC</label>
              <input
                name="cardCvc"
                type="text"
                required
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                placeholder="123"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/70">
                Nom sur la carte
              </label>
              <input
                name="cardHolder"
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Nom du titulaire"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>
          </div>
        ) : null}

        {selected?.type === "cash" ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Nom de la personne payeuse
              </label>
              <input
                name="cashFullName"
                type="text"
                required
                value={cashFullName}
                onChange={(e) => setCashFullName(e.target.value)}
                placeholder="Nom complet"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Téléphone de contact
              </label>
              <input
                name="cashPhone"
                type="tel"
                required
                value={cashPhone}
                onChange={(e) => setCashPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              Cette option simule un paiement physique validé ensuite par l’agence.
              Dans la version finale, ce flux sera traité séparément.
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
          Cette interface est volontairement réaliste, mais reste en mode démonstration.
          Aucun débit réel n’est effectué.
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
          Validation
        </p>

        <div className="mt-6 space-y-3 text-white/70">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptOrder}
              onChange={(e) => setAcceptOrder(e.target.checked)}
              className="mt-1"
            />
            <span>Je confirme les informations de ma commande.</span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <span>J’accepte les conditions générales et la politique de remboursement.</span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptDemo}
              onChange={(e) => setAcceptDemo(e.target.checked)}
              className="mt-1"
            />
            <span>Je comprends qu’il s’agit d’un paiement simulé dans cette version.</span>
          </label>
        </div>

        {!isPaymentDetailsValid ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            Renseigne toutes les informations du moyen de paiement sélectionné avant de continuer.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!isFormValid}
          className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-4 font-medium text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "buy"
            ? `Confirmer le paiement — ${amountDueNow.toLocaleString("fr-FR")} FCFA`
            : `Confirmer l’acompte (${depositPercent}%) — ${amountDueNow.toLocaleString("fr-FR")} FCFA`}
        </button>

        {mode === "reserve" && remainingAmount > 0 ? (
          <p className="mt-3 text-center text-sm text-white/55">
            Solde restant à payer plus tard : {remainingAmount.toLocaleString("fr-FR")} FCFA
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
          <LockKeyhole className="h-4 w-4 text-orange-300" />
          <span>Les informations sont utilisées uniquement pour la simulation de paiement.</span>
        </div>
      </section>
    </form>
  );
}