"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/Button";
import { detectarEstadoPush, activarPush, desactivarPush, type PushEstado } from "@/lib/push-client";

type Estado = "cargando" | PushEstado;

export function PushSubscribeButton() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    detectarEstadoPush().then(setEstado);
  }, []);

  async function activar() {
    setOcupado(true);
    try {
      await activarPush();
      setEstado("activo");
    } catch (e) {
      if (e instanceof Error && e.message === "PERMISO_DENEGADO") {
        setEstado("bloqueado");
      } else {
        console.error("Error al activar push:", e);
      }
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      await desactivarPush();
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
