"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Estado = "invisible" | "mostrar" | "bloqueado" | "ocupado";

export function ActivarNotifBanner() {
  const [estado, setEstado] = useState<Estado>("invisible");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") { setEstado("bloqueado"); return; }

    // Si no hay ningún SW registrado, ready nunca resuelve → verificar primero
    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (regs.length === 0) { setEstado("mostrar"); return; }
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) setEstado("mostrar");
        })
      );
    });
  }, []);

  async function activar() {
    setEstado("ocupado");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setEstado("bloqueado"); return; }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { setEstado("invisible"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(sub.toJSON()),
      });

      setEstado("invisible");
    } catch {
      setEstado("mostrar");
    }
  }

  if (estado === "invisible") return null;

  if (estado === "bloqueado") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
        <BellOff size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Notificaciones bloqueadas</p>
          <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400/80">
            Habilitálas en la configuración del navegador para recibir alertas de turnos y listas.
          </p>
        </div>
        <button onClick={() => setEstado("invisible")} className="shrink-0 text-amber-500 hover:text-amber-700">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
        <Bell size={14} className="text-violet-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">Activá las notificaciones</p>
        <p className="text-[11px] text-lo">Enterate cuando te asignen un turno o se publique la lista.</p>
      </div>
      <button
        onClick={activar}
        disabled={estado === "ocupado"}
        className="shrink-0 rounded-full bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {estado === "ocupado" ? "…" : "Activar"}
      </button>
    </div>
  );
}
