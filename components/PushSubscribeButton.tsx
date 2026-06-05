"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/Button";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

type Estado = "cargando" | "no_soportado" | "bloqueado" | "activo" | "inactivo";

export function PushSubscribeButton() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no_soportado");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setEstado("bloqueado"); return; }

    // Verificar si ya hay una suscripción activa
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setEstado(sub ? "activo" : "inactivo");
      });
    });
  }, []);

  async function activar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setEstado("bloqueado"); return; }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurada"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(sub.toJSON()),
      });

      setEstado("activo");
    } catch (e) {
      console.error("Error al activar push:", e);
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("inactivo");
    } catch (e) {
      console.error("Error al desactivar push:", e);
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "cargando") return null;

  if (estado === "no_soportado") {
    return (
      <p className="text-xs text-gone">
        Tu navegador no soporta notificaciones push.
      </p>
    );
  }

  if (estado === "bloqueado") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5">
        <BellOff size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Las notificaciones están bloqueadas en este dispositivo. Habilitálas desde la configuración del navegador.
        </p>
      </div>
    );
  }

  if (estado === "activo") {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing size={14} className="text-violet-500" />
          <span className="text-sm text-hi">Notificaciones activas en este dispositivo</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={ocupado}
          onClick={desactivar}
          icon={<BellOff size={13} />}
        >
          Desactivar
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      loading={ocupado}
      onClick={activar}
      icon={<Bell size={14} />}
    >
      Activar notificaciones en este dispositivo
    </Button>
  );
}
