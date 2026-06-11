"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Tv2, ListMusic, BookOpen, ArrowRight } from "lucide-react";

interface HeroCardProps {
  listaActiva:  { id_playlist: number; nombre: string; total: number } | null;
  primerNombre: string;
}

const PASOS = [
  { num: "1", label: "Creá una lista",    sub: "en la sección Listas",       href: "/playlists" },
  { num: "2", label: "Agregá canciones",  sub: "del catálogo aprobado",      href: "/canciones"  },
  { num: "3", label: "Abrí en escenario", sub: "cuando arranque el servicio", href: "/playlists" },
] as const;

export function HeroCard({ listaActiva, primerNombre }: HeroCardProps) {
  const tieneListaActiva = !!listaActiva;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card dark:shadow-none"
    >
      {/* ── Eyebrow ──────────────────────────────────────────────── */}
      <div className="relative mb-5 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {tieneListaActiva && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              tieneListaActiva ? "bg-violet-500" : "bg-gone"
            }`}
          />
        </span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
            tieneListaActiva ? "text-violet-600" : "text-lo"
          }`}
        >
          {tieneListaActiva ? "Evento activo" : `Hola, ${primerNombre}`}
        </span>
      </div>

      {tieneListaActiva ? (
        /* ── Estado activo: título + CTA ──────────────────────── */
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <div className="relative flex-1">
            <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight text-hi md:text-2xl">
              {listaActiva!.nombre}
            </h1>
            <p className="mt-2 text-sm text-mid">
              {Number(listaActiva!.total)}&nbsp;
              {Number(listaActiva!.total) === 1 ? "canción" : "canciones"}
            </p>
          </div>

          <Link href={`/escenario/mazo/${listaActiva!.id_playlist}`} className="block md:shrink-0">
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center justify-center gap-3 rounded-2xl bg-violet-600 px-6 py-4 transition-colors duration-200 hover:bg-violet-500 active:bg-violet-700"
            >
              <Tv2 size={20} className="text-white" strokeWidth={2} />
              <span className="text-[15px] font-semibold tracking-wide text-white">
                Abrir Modo Escenario
              </span>
            </motion.div>
          </Link>
        </div>
      ) : (
        /* ── Estado vacío: guía de 3 pasos ───────────────────── */
        <>
          <div className="relative mb-6">
            <h1 className="text-xl font-bold text-hi">
              ¿Por dónde empezás?
            </h1>
            <p className="mt-1 text-sm text-lo">
              Seguí estos pasos para preparar tu servicio.
            </p>
          </div>

          <div className="relative mb-6 flex flex-col gap-2 md:flex-row md:gap-3">
            {PASOS.map((paso) => (
              <Link key={paso.num} href={paso.href} className="flex-1">
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-input px-4 py-3 transition-all duration-200 hover:bg-mark/50 active:scale-[0.98] md:flex-col md:items-start md:gap-2 md:py-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-xs font-semibold text-violet-600">
                    {paso.num}
                  </span>
                  <div className="min-w-0 flex-1 md:flex-none">
                    <p className="text-sm font-medium text-hi">{paso.label}</p>
                    <p className="text-[11px] text-lo">{paso.sub}</p>
                  </div>
                  <ArrowRight size={13} className="shrink-0 text-gone md:hidden" />
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/playlists"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3.5 text-sm font-semibold text-hi shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 active:translate-y-0 active:scale-[0.98] dark:bg-input"
            >
              <ListMusic size={16} className="text-violet-600" />
              Mis listas
            </Link>
            <Link
              href="/canciones"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3.5 text-sm font-semibold text-hi shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 active:translate-y-0 active:scale-[0.98] dark:bg-input"
            >
              <BookOpen size={16} className="text-violet-600" />
              Catálogo
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
