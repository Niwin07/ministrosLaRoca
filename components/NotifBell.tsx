"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  Music2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  X,
} from "lucide-react";

type TipoNotif =
  | "TURNO_ASIGNADO"
  | "LISTA_PUBLICADA"
  | "CANCION_APROBADA"
  | "CANCION_RECHAZADA"
  | "MENCION";

interface Notif {
  id_notificacion: number;
  tipo:      TipoNotif;
  titulo:    string;
  cuerpo:    string;
  leida:     number;
  creadaEn:  string | null;
}

const TIPO_ICON: Record<TipoNotif, React.ReactNode> = {
  TURNO_ASIGNADO:    <Calendar   size={14} className="text-violet-500" />,
  LISTA_PUBLICADA:   <Music2     size={14} className="text-blue-500" />,
  CANCION_APROBADA:  <CheckCircle2 size={14} className="text-green-500" />,
  CANCION_RECHAZADA: <XCircle    size={14} className="text-red-500" />,
  MENCION:           <MessageSquare size={14} className="text-amber-500" />,
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1)  return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotifBell() {
  const [abierto, setAbierto] = useState(false);
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [cargando, setCargando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  const fetchNotifs = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) setNotifs(await res.json());
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial y al volver al foco
  useEffect(() => {
    fetchNotifs();
    const onFocus = () => fetchNotifs();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchNotifs]);

  // Cerrar al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  async function abrir() {
    setAbierto((v) => !v);
    if (!abierto && noLeidas > 0) {
      // Marcar como leídas optimistamente
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: 1 })));
      await fetch("/api/notificaciones", { method: "PATCH" });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={abrir}
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} nuevas)` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-gone transition-colors duration-200 hover:text-hi"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-card shadow-xl dark:shadow-none">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mid">
              Notificaciones
            </span>
            <button
              onClick={() => setAbierto(false)}
              className="text-gone hover:text-hi"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {cargando && notifs.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-gone">Cargando…</p>
            )}
            {!cargando && notifs.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-gone">
                Sin notificaciones todavía
              </p>
            )}
            {notifs.map((n) => (
              <div
                key={n.id_notificacion}
                className={`flex gap-3 border-b border-line/60 px-4 py-3 last:border-b-0 ${
                  !n.leida ? "bg-violet-500/5" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">{TIPO_ICON[n.tipo]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-hi">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-mid leading-snug">{n.cuerpo}</p>
                  <p className="mt-1 text-[10px] text-gone">{timeAgo(n.creadaEn)}</p>
                </div>
                {!n.leida && (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
