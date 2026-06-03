"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ChevronDown,
  Copy,
  CalendarDays,
  Music2,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface CancionPreview {
  orden:   number;
  nota:    string | null;
  nombre:  string;
  artista: string;
}

interface ListaHistorial {
  id_playlist:    number;
  nombre:         string;
  nombre_usuario: string;
  fecha:          string;
  total:          number;
  canciones:      CancionPreview[];
}

interface Props {
  listas:    ListaHistorial[];
  onClonar:  (formData: FormData) => Promise<void>;
}

export function HistorialListas({ listas, onClonar }: Props) {
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<number | null>(null);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return listas;
    return listas.filter(
      (l) =>
        l.nombre.toLowerCase().includes(t) ||
        l.nombre_usuario.toLowerCase().includes(t) ||
        l.canciones.some((c) => c.nombre.toLowerCase().includes(t)),
    );
  }, [q, listas]);

  if (listas.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-card px-5 py-5 text-sm text-lo">
        Sin servicios archivados todavía. Cuando finalices una lista y la marques como{" "}
        <span className="font-medium text-mid">Archivada</span>, va a aparecer acá.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Buscador — solo cuando hay varias para que valga la pena */}
      {listas.length > 3 && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gone" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, ministro o canción…"
            className="w-full rounded-xl border border-mark bg-input py-2.5 pl-9 pr-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-5 text-sm text-lo">
          Nada coincide con &ldquo;{q}&rdquo;.
        </p>
      ) : (
        filtradas.map((lista) => (
          <FilaHistorial
            key={lista.id_playlist}
            lista={lista}
            abierta={abierta === lista.id_playlist}
            onToggle={() =>
              setAbierta((prev) => (prev === lista.id_playlist ? null : lista.id_playlist))
            }
            onClonar={onClonar}
          />
        ))
      )}
    </div>
  );
}

function FilaHistorial({
  lista,
  abierta,
  onToggle,
  onClonar,
}: {
  lista:    ListaHistorial;
  abierta:  boolean;
  onToggle: () => void;
  onClonar: (formData: FormData) => Promise<void>;
}) {
  const [clonando, startClonar] = useTransition();

  function handleClonar() {
    const fd = new FormData();
    fd.set("id_playlist", String(lista.id_playlist));
    startClonar(async () => {
      await onClonar(fd);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card dark:shadow-none">

      {/* Cabecera */}
      <div className="flex items-center gap-3 border-l-2 border-l-gone px-4 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={abierta}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-hi">{lista.nombre}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-lo">
              <span className="truncate">{lista.nombre_usuario}</span>
              <span className="inline-flex items-center gap-1 text-gone">
                <CalendarDays size={10} />
                {lista.fecha}
              </span>
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-input px-2 py-0.5 text-[10px] font-medium text-mid">
            <Music2 size={9} />
            {lista.total}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-gone transition-transform duration-200 ${abierta ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Detalle expandible */}
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line"
          >
            {/* Canciones */}
            {lista.canciones.length === 0 ? (
              <p className="px-4 py-4 text-xs text-lo">Esta lista quedó sin canciones.</p>
            ) : (
              <ul className="divide-y divide-line">
                {lista.canciones.map((c, idx) => (
                  <li key={`${lista.id_playlist}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-5 shrink-0 text-right text-[11px] font-medium tabular-nums text-gone">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-hi">{c.nombre}</p>
                      <p className="truncate text-[11px] text-lo">{c.artista}</p>
                    </div>
                    {c.nota && (
                      <span className="shrink-0 text-sm font-semibold text-violet-600">{c.nota}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Acciones */}
            <div className="flex items-center gap-2 border-t border-line px-4 py-3">
              <button
                type="button"
                onClick={handleClonar}
                disabled={clonando}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95 disabled:opacity-60"
              >
                {clonando ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
                {clonando ? "Clonando…" : "Reutilizar"}
              </button>
              <Link
                href={`/playlists/${lista.id_playlist}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-mark bg-input px-3.5 py-2 text-xs font-medium text-mid transition-colors hover:border-line hover:text-hi"
              >
                <ExternalLink size={12} />
                Abrir
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
