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
  const lastTokenRef = useRef<string | null>(null);
  const lastScanAtRef = useRef<number>(0);

  const [manualToken, setManualToken] = useState("");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {}

    try {
      await scanner.clear();
    } catch {}

    scannerRef.current = null;
    setIsScannerRunning(false);
  }

  async function validateToken(rawToken: string) {
    if (!rawToken.trim()) return null;
    if (isBusyRef.current) return null;

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
        await stopScanner();
      } else {
        toast.error(data.message);
      }

      return data;
    } catch {
      toast.error("Erreur de validation du scan");
      return null;
    } finally {
      setTimeout(() => {
        isBusyRef.current = false;
      }, 1500);
    }
  }

  async function startScanner() {
    try {
      setIsStarting(true);
      setCameraError(null);

      const { Html5Qrcode } = await import("html5-qrcode");
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw new Error("Aucune caméra détectée.");
      }

      const scanner = new Html5Qrcode("ticket-scanner-region");
      scannerRef.current = scanner;

      await scanner.start(
        cameras[0].id,
        {
          fps: 8,
          qrbox: { width: 240, height: 240 },
        },
        async (decodedText: string) => {
          const now = Date.now();

          if (
            decodedText === lastTokenRef.current &&
            now - lastScanAtRef.current < 5000
          ) {
            return;
          }

          lastTokenRef.current = decodedText;
          lastScanAtRef.current = now;

          await validateToken(decodedText);
        },
        () => {},
      );

      setIsScannerRunning(true);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Impossible de démarrer la caméra",
      );
      setIsScannerRunning(false);
    } finally {
      setIsStarting(false);
    }
  }

  useEffect(() => {
    void startScanner();

    return () => {
      void stopScanner();
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
          <p className="mt-4 text-sm text-white/50">
            Initialisation de la caméra…
          </p>
        ) : null}

        {cameraError ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {cameraError}
          </div>
        ) : null}

        {!isScannerRunning ? (
          <button
            onClick={() => void startScanner()}
            className="mt-4 rounded-2xl bg-orange-500 px-4 py-2 font-medium text-black transition hover:bg-orange-400"
          >
            Relancer la caméra
          </button>
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
              onClick={() => void validateToken(manualToken)}
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
                <p>
                  <span className="text-white/50">Référence :</span>{" "}
                  {lastResult.ticket.serialNumber}
                </p>
                <p>
                  <span className="text-white/50">Titulaire :</span>{" "}
                  {lastResult.ticket.holderName ?? "—"}
                </p>
                <p>
                  <span className="text-white/50">Email :</span>{" "}
                  {lastResult.ticket.holderEmail ?? "—"}
                </p>
                <p>
                  <span className="text-white/50">Événement :</span>{" "}
                  {lastResult.ticket.eventTitle}
                </p>
                <p>
                  <span className="text-white/50">Lieu :</span>{" "}
                  {lastResult.ticket.venueName}
                </p>
                {"ticketTypeName" in lastResult.ticket ? (
                  <p>
                    <span className="text-white/50">Billet :</span>{" "}
                    {(lastResult.ticket as any).ticketTypeName}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}