"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, GripVertical, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cls } from "@/components/zarza/ui";
import { BotonConfirmado } from "@/components/zarza/Confirmacion";
import { SALIDA_ITEM } from "@/components/zarza/ListaAnimada";
import { useEscalonarInicial } from "@/components/zarza/useNuevos";
import type { ResultadoAccion } from "@/app/actions/contenido";
import { youtubeUrl } from "@/lib/youtube";

export interface Paso {
  id: number;
  titulo: string;
  detalle: string | null;
  youtube_id?: string | null;
}

type Accion = (fd: FormData) => Promise<ResultadoAccion>;

interface Props {
  pasos:        Paso[];
  /** "Ejercicio" o "Paso" */
  rotulo:       string;
  /** clave de localStorage para los tildes de este dispositivo */
  claveTildes:  string;
  editando:     boolean;
  /** tono del tilde: llama (calentamiento) o vino (protocolo) */
  tono?:        "llama" | "vino";
  conVideo?:    boolean;
  campos:       { titulo: string; tituloPh: string; detalle: string; detallePh?: string };
  formAbierto:  null | "nuevo" | number;
  setFormAbierto: (v: null | "nuevo" | number) => void;
  guardar:      Accion;
  eliminar:     Accion;
  mover:        Accion;
}

/**
 * Lista de pasos con tildes (progreso guardado en este dispositivo) y, en modo
 * edición, alta/edición/borrado/orden. Usada por Calentamiento y Protocolo.
 */
export function PasosChecklist({
  pasos, rotulo, claveTildes, editando, tono = "llama", conVideo, campos,
  formAbierto, setFormAbierto, guardar, eliminar, mover,
}: Props) {
  const [hechos, setHechos] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const reducir = useReducedMotion();
  const escalonar = useEscalonarInicial();

  useEffect(() => {
    try {
      const v = localStorage.getItem(claveTildes);
      if (v) setHechos(JSON.parse(v));
    } catch {}
  }, [claveTildes]);

  function guardarTildes(n: Record<number, boolean>) {
    setHechos(n);
    try { localStorage.setItem(claveTildes, JSON.stringify(n)); } catch {}
  }

  const listos = pasos.filter((p) => hechos[p.id]).length;
  const progreso = pasos.length ? Math.round((listos / pasos.length) * 100) : 0;

  const tilde = tono === "vino"
    ? { on: "border-[#7a2a26] bg-[#7a2a26]", off: "border-[#efc7b3] bg-[#fcf5eb] dark:bg-card", fila: "border-[rgba(122,42,38,0.35)] bg-[#fbede6] dark:bg-[#1e1513]", titulo: "text-[#7a442a] dark:text-[#d69271]", barra: "bg-[#7a2a26]" }
    : { on: "border-[#b85a44] bg-[#b85a44]", off: "border-[#f5b5a0] bg-[#fcf5eb] dark:bg-card", fila: "border-[rgba(199,97,58,0.3)] bg-[#fdf0ea] dark:bg-[#1e1513]", titulo: "text-[#7a4a3e] dark:text-[#d5c0a5]", barra: "bg-[#b85a44]" };

  function enviar(accion: Accion, fd: FormData, alTerminar?: () => void) {
    setError(null);
    start(async () => {
      const r = await accion(fd);
      if (!r.ok) setError(r.error);
      else alTerminar?.();
    });
  }

  const editado = typeof formAbierto === "number" ? pasos.find((p) => p.id === formAbierto) : undefined;

  return (
    <div className="flex max-w-[760px] flex-col gap-2.5">
      {error && (
        <p role="alert" className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-700 dark:text-red-400">{error}</p>
      )}

      {editando && formAbierto !== null && (
        <form
          className={cls.panelForm}
          action={(fd) => enviar(guardar, fd, () => setFormAbierto(null))}
        >
          <p className="text-[15px] font-bold text-hi">{editado ? `Editar ${rotulo.toLowerCase()}` : `Nuevo ${rotulo.toLowerCase()}`}</p>
          {editado && <input type="hidden" name="id" value={editado.id} />}
          <label className={cls.etiqueta}>
            {campos.titulo}
            <input name={rotulo === "Paso" ? "titulo" : "nombre"} required maxLength={200} defaultValue={editado?.titulo ?? ""} placeholder={campos.tituloPh} className={cls.campo} />
          </label>
          <label className={cls.etiqueta}>
            {campos.detalle}
            <textarea name={rotulo === "Paso" ? "detalle" : "descripcion"} rows={3} maxLength={2000} defaultValue={editado?.detalle ?? ""} placeholder={campos.detallePh} className={cls.campoArea} />
          </label>
          {conVideo && (
            <label className={cls.etiqueta}>
              Video de YouTube (opcional)
              <input name="url" type="url" defaultValue={editado?.youtube_id ? youtubeUrl(editado.youtube_id) : ""} placeholder="https://youtube.com/watch?v=…" className={cls.campo} />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormAbierto(null)} className={`${cls.btnSec} min-h-[42px]`}>Cancelar</button>
            <button type="submit" disabled={pending} className={`${cls.btnLlama} min-h-[42px]`}>{pending ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      )}

      {!editando && pasos.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso">
            <div className={`h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${tilde.barra}`} style={{ width: `${progreso}%` }} />
          </div>
          <span key={listos} className={`text-[13px] font-semibold text-[#7a2410] dark:text-[#e6d1cc] ${listos > 0 ? "animate-rebote inline-block" : ""}`}>{listos === pasos.length ? "¡Listo! " : ""}{listos} de {pasos.length}</span>
          <button type="button" onClick={() => guardarTildes({})} className={cls.btnTexto}>Reiniciar</button>
        </div>
      )}

      <ol className={`${escalonar} flex flex-col gap-2.5`}>
        <AnimatePresence initial={false} mode="popLayout">
        {pasos.map((p, i) => {
          const hecho = !editando && !!hechos[p.id];
          return (
            <motion.li
              key={p.id}
              layout={!reducir}
              {...(reducir ? {} : SALIDA_ITEM)}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className={`flex items-start gap-3.5 rounded-[18px] border p-4 transition-colors ${hecho ? tilde.fila : "border-line bg-[#fcf5eb] dark:bg-card"}`}
            >
              {!editando ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={hecho}
                  aria-label={`Marcar ${rotulo.toLowerCase()} ${i + 1} como hecho`}
                  onClick={() => guardarTildes({ ...hechos, [p.id]: !hechos[p.id] })}
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-white transition-colors ${hecho ? tilde.on : tilde.off}`}
                >
                  {hecho && <Check size={16} strokeWidth={3} aria-hidden className="animate-pop" />}
                </button>
              ) : (
                <span aria-hidden className="flex h-8 w-5 items-center justify-center text-gone">
                  <GripVertical size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#b85a44] dark:text-[#d08877]">{rotulo} {i + 1}</p>
                <p className={`mt-0.5 text-base font-semibold ${hecho ? tilde.titulo : "text-hi"}`}>{p.titulo}</p>
                {p.detalle && <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-mid">{p.detalle}</p>}
                {p.youtube_id && (
                  <a href={youtubeUrl(p.youtube_id)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuego-600 hover:underline dark:text-[#ef7a4c]">
                    <PlayCircle size={15} aria-hidden /> Ver video
                  </a>
                )}
              </div>
              {editando && (
                <div className="flex shrink-0 flex-wrap items-center gap-0.5">
                  <form action={(fd) => enviar(mover, fd)}>
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="arriba" />
                    <button type="submit" disabled={pending || i === 0} aria-label="Subir" className={cls.btnIcono}><ChevronUp size={18} aria-hidden /></button>
                  </form>
                  <form action={(fd) => enviar(mover, fd)}>
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="abajo" />
                    <button type="submit" disabled={pending || i === pasos.length - 1} aria-label="Bajar" className={cls.btnIcono}><ChevronDown size={18} aria-hidden /></button>
                  </form>
                  <button type="button" onClick={() => setFormAbierto(p.id)} aria-label={`Editar ${rotulo.toLowerCase()}`} className={cls.btnIcono}><Pencil size={16} aria-hidden /></button>
                  <form action={(fd) => enviar(eliminar, fd)}>
                    <input type="hidden" name="id" value={p.id} />
                    <BotonConfirmado
                      confirmacion={{
                        titulo: `¿Eliminar este ${rotulo.toLowerCase()}?`,
                        mensaje: <>Se va a borrar <strong className="font-semibold text-hi">“{p.titulo}”</strong> para todo el equipo.</>,
                      }}
                      disabled={pending}
                      aria-label={`Eliminar ${rotulo.toLowerCase()}`}
                      className={`${cls.btnIcono} text-gone hover:text-red-600`}
                    >
                      <Trash2 size={16} aria-hidden />
                    </BotonConfirmado>
                  </form>
                </div>
              )}
            </motion.li>
          );
        })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
