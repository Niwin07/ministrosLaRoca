"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Tv2, ListMusic, BookOpen, ArrowRight } from "lucide-react";

interface HeroCardProps {
  listaActiva:  { id_playlist: number; nombre: string; total: number } | null;
  primerNombre: string;
}

const PASOS = [
  { num: "1", label: "Creá una lista",    sub: "en la sección Listas",    href: "/playlists" },
  { num: "2", label: "Agregá canciones",  sub: "del catálogo aprobado",   href: "/canciones"  },
  { num: "3", label: "Abrí en escenario", sub: "cuando arranque el servicio", href: "/playlists" },
] as const;

export function HeroCard({ listaActiva, primerNombre }: HeroCardProps) {
  const tieneListaActiva = !!listaActiva;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-glass-elevated bg-glass-elevated p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl"
    >
      {tieneListaActiva && (
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-lime-400/10 blur-3xl" />
      )}
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />

      {/* ── Eyebrow ──────────────────────────────────────────────── */}
      <div className="relative mb-5 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {tieneListaActiva && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              tieneListaActiva ? "bg-lime-400" : "bg-glass-highlight"
            }`}
          />
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
            tieneListaActiva ? "text-lime-400/90" : "text-content-muted"
          }`}
        >
          {tieneListaActiva ? "Evento activo" : `Hola, ${primerNombre}`}
        </span>
      </div>

      {tieneListaActiva ? (
        /* ── Estado activo: título + CTA ──────────────────────── */
        <>
          <div className="relative mb-7">
            <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight text-white">
              {listaActiva!.nombre}
            </h1>
            <p className="mt-2 text-sm text-content-secondary">
              {Number(listaActiva!.total)}&nbsp;
              {Number(listaActiva!.total) === 1 ? "canción" : "canciones"}
            </p>
          </div>

          <Link href={`/escenario/mazo/${listaActiva!.id_playlist}`} className="block">
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-300 py-4 shadow-lg shadow-lime-400/25 transition-shadow duration-300 hover:shadow-lime-400/40"
            >
              <Tv2 size={20} className="text-black" strokeWidth={2.5} />
              <span className="text-[15px] font-bold tracking-wide text-black">
                Abrir Modo Escenario
              </span>
            </motion.div>
          </Link>
        </>
      ) : (
        /* ── Estado vacío: guía de 3 pasos ───────────────────── */
        <>
          <div className="relative mb-6">
            <h1 className="text-xl font-bold text-white">
              ¿Por dónde empezás?
            </h1>
            <p className="mt-1 text-sm text-content-muted">
              Seguí estos pasos para preparar tu servicio.
            </p>
          </div>

          <div className="relative mb-6 flex flex-col gap-3">
            {PASOS.map((paso) => (
              <Link key={paso.num} href={paso.href}>
                <div className="flex items-center gap-3 rounded-2xl border border-glass-base bg-glass-subtle px-4 py-3 transition-all duration-200 hover:bg-glass-base active:scale-[0.98]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                    {paso.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-content-primary">{paso.label}</p>
                    <p className="text-[11px] text-content-muted">{paso.sub}</p>
                  </div>
                  <ArrowRight size={13} className="shrink-0 text-content-muted" />
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/playlists"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-glass-elevated bg-glass-base py-3 text-sm font-semibold text-content-secondary transition-all duration-200 hover:bg-glass-elevated"
            >
              <ListMusic size={15} />
              Mis listas
            </Link>
            <Link
              href="/canciones"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-glass-elevated bg-glass-base py-3 text-sm font-semibold text-content-secondary transition-all duration-200 hover:bg-glass-elevated"
            >
              <BookOpen size={15} />
              Catálogo
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
