"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ScanResult =
  | {
      ok: true;
      code: "SUCCESS";
      message: string;
      ticket: {
        id: string;
        serialNumber: string;
        holderName: string | null;
        holderEmail: string | null;
        eventTitle: string;
        venueName: string;
        ticketTypeName: string;
      };
    }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "INVALID"
        | "ALREADY_USED"
        | "REFUNDED"
        | "CANCELLED"
        | "EXPIRED";
      message: string;
      ticket?: {
        id: string;
        serialNumber: string;
        holderName: string | null;
        holderEmail: string | null;
        eventTitle: string;
        venueName: string;
      };
    };

export function QrScanner() {
  const scannerRef = useRef<any>(null);
  const isBusyRef = useRef(false);
  const [manualToken, setManualToken] = useState("");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  async function validateToken(rawToken: string) {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    try {
      const response = await fetch("/api/scanner/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawToken }),
      });

      const data = (await response.json()) as ScanResult;

      setLastResult(data);

      if (data.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Erreur de validation du scan");
    } finally {
      setTimeout(() => {
        isBusyRef.current = false;
      }, 1200);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted) return;

        const scanner = new Html5Qrcode("ticket-scanner-region");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          async (decodedText: string) => {
            await validateToken(decodedText);
          },
          () => {},
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch {
        setIsStarting(false);
        toast.error("Impossible de démarrer la caméra");
      }
    }

    startScanner();

    return () => {
      mounted = false;

      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
          Scanner caméra
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Contrôle d’entrée</h2>
        <p className="mt-3 text-white/70">
          Scanne le QR du billet ou colle un token de dev pour tester.
        </p>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4">
          <div id="ticket-scanner-region" className="min-h-[320px]" />
        </div>

        {isStarting ? (
          <p className="mt-4 text-sm text-white/50">Initialisation de la caméra…</p>
        ) : null}

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
            Test manuel
          </p>

          <div className="mt-4 space-y-3">
            <textarea
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              rows={4}
              placeholder="Colle ici un token du style 3d2y:ticketId:serialNumber"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
            />
            <button
              onClick={() => validateToken(manualToken)}
              className="rounded-2xl bg-orange-500 px-5 py-3 font-medium text-black transition hover:bg-orange-400"
            >
              Valider manuellement
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
          Résultat
        </p>

        {!lastResult ? (
          <p className="mt-4 text-white/60">Aucun scan pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div
              className={`rounded-2xl p-4 ${
                lastResult.ok
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-red-500/15 text-red-200"
              }`}
            >
              <p className="text-sm uppercase tracking-[0.2em]">
                {lastResult.code}
              </p>
              <p className="mt-2 text-lg font-semibold">{lastResult.message}</p>
            </div>

            {lastResult.ticket ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/80">
                <p><span className="text-white/50">Référence :</span> {lastResult.ticket.serialNumber}</p>
                <p><span className="text-white/50">Titulaire :</span> {lastResult.ticket.holderName ?? "—"}</p>
                {"holderEmail" in lastResult.ticket ? (
                  <p><span className="text-white/50">Email :</span> {lastResult.ticket.holderEmail ?? "—"}</p>
                ) : null}
                <p><span className="text-white/50">Événement :</span> {lastResult.ticket.eventTitle}</p>
                <p><span className="text-white/50">Lieu :</span> {lastResult.ticket.venueName}</p>
                {"ticketTypeName" in lastResult.ticket ? (
                  <p><span className="text-white/50">Billet :</span> {lastResult.ticket.ticketTypeName}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}