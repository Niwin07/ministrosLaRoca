"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cls } from "@/components/zarza/ui";
import { BotonConfirmado } from "@/components/zarza/Confirmacion";
import { SALIDA_ITEM } from "@/components/zarza/ListaAnimada";
import type { ResultadoAccion } from "@/app/actions/contenido";
import { youtubeMiniatura, youtubeUrl } from "@/lib/youtube";

export interface Video {
  id: number;
  youtube_id: string;
  titulo: string;
  canal?: string | null;
}

type Accion = (fd: FormData) => Promise<ResultadoAccion>;

interface Props {
  videos:      Video[];
  editando:    boolean;
  /** "cuadro": mosaico cuadrado (Calentamiento). "ficha": tarjeta 16:9 con canal (Quiero mejorar). */
  variante:    "cuadro" | "ficha";
  formAbierto: null | "nuevo" | number;
  setFormAbierto: (v: null | "nuevo" | number) => void;
  guardar:     Accion;
  eliminar:    Accion;
  mover:       Accion;
  /** campos ocultos extra en cada form (p. ej. id_categoria) */
  extra?:      Record<string, string | number>;
  textoForm?:  { titulo: string; nota: string };
}

function Ocultos({ extra }: { extra?: Record<string, string | number> }) {
  return <>{extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}</>;
}

/** Grilla de videos de YouTube con alta/edición/orden en modo edición. */
export function VideosGrilla({
  videos, editando, variante, formAbierto, setFormAbierto, guardar, eliminar, mover, extra, textoForm,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const reducir = useReducedMotion();

  function enviar(accion: Accion, fd: FormData, alTerminar?: () => void) {
    setError(null);
    start(async () => {
      const r = await accion(fd);
      if (!r.ok) setError(r.error);
      else alTerminar?.();
    });
  }

  const editado = typeof formAbierto === "number" ? videos.find((v) => v.id === formAbierto) : undefined;

  const acciones = (v: Video, i: number) => (
    <div className="absolute right-2 top-2 flex gap-1.5">
      {[
        { dir: "arriba", Icono: ChevronLeft, label: "Mover antes", off: i === 0 },
        { dir: "abajo", Icono: ChevronRight, label: "Mover después", off: i === videos.length - 1 },
      ].map(({ dir, Icono, label, off }) => (
        <form key={dir} action={(fd) => enviar(mover, fd)}>
          <Ocultos extra={extra} /><input type="hidden" name="id" value={v.id} /><input type="hidden" name="dir" value={dir} />
          <button type="submit" disabled={pending || off} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-mid shadow-[0_2px_6px_rgba(0,0,0,0.15)] disabled:opacity-40">
            <Icono size={15} aria-hidden />
          </button>
        </form>
      ))}
      <button type="button" onClick={() => setFormAbierto(v.id)} aria-label="Editar video" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-mid shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
        <Pencil size={14} aria-hidden />
      </button>
      <form action={(fd) => enviar(eliminar, fd)}>
        <Ocultos extra={extra} /><input type="hidden" name="id" value={v.id} />
        <BotonConfirmado
          confirmacion={{
            titulo: "¿Quitar este video?",
            mensaje: <>“{v.titulo}” deja de aparecer en esta sección.</>,
            confirmar: "Quitar",
          }}
          disabled={pending}
          aria-label="Quitar video"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-red-600 shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
        >
          <Trash2 size={14} aria-hidden />
        </BotonConfirmado>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-700 dark:text-red-400">{error}</p>
      )}

      {editando && formAbierto !== null && (
        <form className={cls.panelForm} action={(fd) => enviar(guardar, fd, () => setFormAbierto(null))}>
          <p className="text-[15px] font-bold text-hi">{editado ? "Editar video" : (textoForm?.titulo ?? "Nuevo video")}</p>
          <Ocultos extra={extra} />
          {editado ? (
            <input type="hidden" name="id" value={editado.id} />
          ) : (
            <label className={cls.etiqueta}>
              Link de YouTube
              <input name="url" type="url" required placeholder="https://youtube.com/watch?v=…" className={cls.campo} />
            </label>
          )}
          <label className={cls.etiqueta}>
            {variante === "ficha" ? "Título" : "Nombre del video"}
            <input name="titulo" maxLength={255} required={!!editado} defaultValue={editado?.titulo ?? ""} placeholder="Si lo dejás vacío, se usa el de YouTube" className={cls.campo} />
          </label>
          {!editado && <p className="text-xs text-lo">{textoForm?.nota ?? "La miniatura y el título se toman del link."}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormAbierto(null)} className={`${cls.btnSec} min-h-[42px]`}>Cancelar</button>
            <button type="submit" disabled={pending} className={`${cls.btnLlama} min-h-[42px]`}>{pending ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      )}

      {variante === "cuadro" ? (
        <div className="escalonar grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-[18px]">
          <AnimatePresence initial={false} mode="popLayout">
          {videos.map((v, i) => (
            <motion.div key={v.id} layout={!reducir} {...(reducir ? {} : SALIDA_ITEM)} transition={{ type: "spring", stiffness: 420, damping: 36 }} className="min-w-0">
            <div className="relative flex min-w-0 flex-col gap-2">
              <a
                href={youtubeUrl(v.youtube_id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${v.titulo} (abre YouTube)`}
                className="tarjeta-viva group relative block aspect-square overflow-hidden rounded-3xl bg-llama shadow-[0_1px_2px_rgba(43,22,17,0.06),0_10px_24px_-12px_rgba(199,97,58,0.35)]"
              >
                <img src={youtubeMiniatura(v.youtube_id)} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#5e1f18]/70 via-transparent to-transparent" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[#fffbf5]">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></svg>
                </span>
              </a>
              {editando && acciones(v, i)}
              <p className="mx-0.5 text-[13px] font-semibold leading-snug text-hi">{v.titulo}</p>
            </div>
            </motion.div>
          ))}
          </AnimatePresence>
          {editando && (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setFormAbierto("nuevo")} aria-label="Agregar video" className="flex aspect-square items-center justify-center rounded-3xl border-2 border-dashed border-mark bg-white/50 text-lo dark:bg-white/5">
                <Plus size={30} aria-hidden />
              </button>
              <p className="mx-0.5 text-[13px] font-semibold text-lo">Agregar</p>
            </div>
          )}
        </div>
      ) : (
        <div className="escalonar grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
          {videos.map((v, i) => (
            <motion.div key={v.id} layout={!reducir} {...(reducir ? {} : SALIDA_ITEM)} transition={{ type: "spring", stiffness: 420, damping: 36 }} className="min-w-0">
            <article className="tarjeta-viva h-full group flex flex-col overflow-hidden rounded-[20px] border border-line bg-card shadow-[0_1px_2px_rgba(43,22,17,0.06),0_8px_24px_-12px_rgba(120,45,15,0.2)] dark:shadow-none">
              <div className="relative aspect-video bg-llama">
                <img src={youtubeMiniatura(v.youtube_id)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></svg>
                </span>
                {editando && acciones(v, i)}
              </div>
              <div className="flex flex-col gap-2.5 px-4 pb-4 pt-3.5">
                <div>
                  <p className="text-[15px] font-semibold leading-snug text-hi">{v.titulo}</p>
                  {v.canal && <p className="mt-0.5 text-xs text-lo">{v.canal}</p>}
                </div>
                <a href={youtubeUrl(v.youtube_id)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 w-fit items-center gap-1.5 text-[13px] font-semibold text-fuego-600 hover:underline dark:text-[#ef7a4c]">
                  Ver en YouTube <ExternalLink size={13} aria-hidden />
                </a>
              </div>
            </article>
            </motion.div>
          ))}
          </AnimatePresence>
          {editando && (
            <button type="button" onClick={() => setFormAbierto("nuevo")} className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-mark bg-white/50 text-sm font-semibold text-lo dark:bg-white/5">
              <Plus size={28} aria-hidden /> Agregar video
            </button>
          )}
        </div>
      )}
    </div>
  );
}
