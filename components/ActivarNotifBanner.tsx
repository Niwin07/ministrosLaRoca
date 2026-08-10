"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/ui/IconButton";
import { detectarEstadoPush, activarPush } from "@/lib/push-client";

type Estado = "invisible" | "mostrar" | "bloqueado" | "ocupado";

export function ActivarNotifBanner() {
  const [estado, setEstado] = useState<Estado>("invisible");

  useEffect(() => {
    detectarEstadoPush().then((e) => {
      if (e === "bloqueado") setEstado("bloqueado");
      else if (e === "inactivo") setEstado("mostrar");
    });
  }, []);

  async function activar() {
    setEstado("ocupado");
    try {
      await activarPush();
      setEstado("invisible");
    } catch (e) {
      if (e instanceof Error && e.message === "PERMISO_DENEGADO") {
        setEstado("bloqueado");
      } else {
        console.error("Error al activar push:", e);
        setEstado("invisible"); // No rebotar al "mostrar" — el usuario ya intentó
      }
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
        <IconButton
          icon={<X size={13} />}
          label="Descartar aviso"
          size="sm"
          onClick={() => setEstado("invisible")}
          className="text-amber-500 hover:text-amber-700 hover:bg-transparent"
        />
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
      <Button
        type="button"
        size="sm"
        loading={estado === "ocupado"}
        onClick={activar}
        className="shrink-0"
      >
        Activar
      </Button>
    </div>
  );
}
