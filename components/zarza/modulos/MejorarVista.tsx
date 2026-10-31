"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GripVertical, Pencil, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Encabezado, BannerEdicion, Vacio, cls } from "@/components/zarza/ui";
import { useConfirmar } from "@/components/zarza/Confirmacion";
import { SALIDA_ITEM } from "@/components/zarza/ListaAnimada";
import { useEscalonarInicial } from "@/components/zarza/useNuevos";
import { BotonesEdicion } from "@/components/zarza/modulos/BotonesEdicion";
import { IconoMarca, type IconoMarcaNombre } from "@/components/zarza/IconoMarca";
import { guardarCategoria, eliminarCategoria, type ResultadoAccion } from "@/app/actions/contenido";
import { COLORES_CATEGORIA, ICONOS_CATEGORIA } from "@/lib/modulos";

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  videos: number;
}

const ETIQUETA_ICONO: Record<string, string> = {
  voz: "Voz", guitarra: "Guitarra", bajo: "Bajo", bateria: "Batería", teclado: "Teclado",
  consola: "Sonido", comunicacion: "Comunicación", mejorar: "General",
};

export function MejorarVista({ categorias, puedeEditar }: { categorias: Categoria[]; puedeEditar: boolean }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<null | "nueva" | number>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const confirmar = useConfirmar();
  const reducir = useReducedMotion();
  const escalonar = useEscalonarInicial();

  const editada = typeof form === "number" ? categorias.find((c) => c.id === form) : undefined;
  const [color, setColor] = useState("llama");
  const [icono, setIcono] = useState("mejorar");

  function abrir(v: "nueva" | number) {
    const c = typeof v === "number" ? categorias.find((x) => x.id === v) : undefined;
    setColor(c?.color ?? "llama");
    setIcono(c?.icono ?? "mejorar");
    setError(null);
    setForm(v);
  }

  function enviar(accion: (fd: FormData) => Promise<ResultadoAccion>, fd: FormData) {
    setError(null);
    start(async () => {
      const r = await accion(fd);
      if (!r.ok) setError(r.error);
      else setForm(null);
    });
  }

  return (
    <div className={`${cls.pagina} max-w-[1040px]`}>
      <Encabezado
        volver={{ href: "/", label: "Inicio" }}
        icono="mejorar"
        titulo="Quiero mejorar"
        sub="Elegí en qué querés crecer"
        acciones={puedeEditar ? (
          <BotonesEdicion
            editando={editando}
            setEditando={(v) => { setEditando(v); setForm(null); }}
            agregarTxt="Nueva categoría"
            onAgregar={() => abrir("nueva")}
          />
        ) : undefined}
      />

      {editando && (
        <BannerEdicion>
          Tocá el lápiz de una categoría para cambiarle el nombre, el color o borrarla. Entrá a una categoría para elegir sus videos. Lo que cambies lo ve todo el equipo.
        </BannerEdicion>
      )}

      {error && <p role="alert" className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-700 dark:text-red-400">{error}</p>}

      {editando && form !== null && (
        <form className={cls.panelForm} action={(fd) => enviar(guardarCategoria, fd)}>
          <p className="text-[15px] font-bold text-hi">{editada ? "Editar categoría" : "Nueva categoría"}</p>
          {editada && <input type="hidden" name="id" value={editada.id} />}
          <label className={cls.etiqueta}>
            Nombre
            <input name="nombre" required maxLength={100} defaultValue={editada?.nombre ?? ""} placeholder="Ej: Violín" className={cls.campo} />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[13px] font-medium text-mid">Color</legend>
            <input type="hidden" name="color" value={color} />
            <div className="flex flex-wrap gap-2">
              {Object.entries(COLORES_CATEGORIA).map(([k, c]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setColor(k)}
                  aria-label={`Color ${k}`}
                  aria-pressed={color === k}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c.fondo, borderColor: color === k ? c.borde : "transparent" }}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[13px] font-medium text-mid">Ícono</legend>
            <input type="hidden" name="icono" value={icono} />
            <div className="flex flex-wrap gap-2">
              {ICONOS_CATEGORIA.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcono(i)}
                  aria-label={ETIQUETA_ICONO[i]}
                  aria-pressed={icono === i}
                  title={ETIQUETA_ICONO[i]}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 bg-[#fcf2e6] dark:bg-input ${icono === i ? "border-fuego-500" : "border-transparent"}`}
                >
                  <IconoMarca nombre={i as IconoMarcaNombre} size={28} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {editada ? (
              <button
                type="button"
                disabled={pending}
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: "¿Borrar esta categoría?",
                    mensaje: <>Se borra <strong className="font-semibold text-hi">“{editada.nombre}”</strong>{editada.videos > 0 ? <> junto con sus {editada.videos} {editada.videos === 1 ? "video" : "videos"}</> : null}. No se puede deshacer.</>,
                    confirmar: "Borrar categoría",
                  });
                  if (!ok) return;
                  const fd = new FormData();
                  fd.set("id", String(editada.id));
                  enviar(eliminarCategoria, fd);
                }}
                className="min-h-[42px] rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-400"
              >
                Borrar categoría
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(null)} className={`${cls.btnSec} min-h-[42px]`}>Cancelar</button>
              <button type="submit" disabled={pending} className={`${cls.btnLlama} min-h-[42px]`}>{pending ? "Guardando…" : "Guardar"}</button>
            </div>
          </div>
        </form>
      )}

      {categorias.length === 0 && !editando ? (
        <Vacio titulo="Todavía no hay categorías">
          {puedeEditar ? "Tocá Editar para crear la primera." : "Cuando se carguen, las vas a ver acá."}
        </Vacio>
      ) : (
        <div className={`${escalonar} grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-[18px]`}>
          <AnimatePresence initial={false} mode="popLayout">
          {categorias.map((c) => {
            const col = COLORES_CATEGORIA[c.color] ?? COLORES_CATEGORIA.llama;
            return (
              <motion.div key={c.id} layout={!reducir} {...(reducir ? {} : SALIDA_ITEM)} transition={{ type: "spring", stiffness: 420, damping: 36 }} className="relative flex min-w-0 flex-col gap-2">
                <Link
                  href={`/mejorar/${c.id}`}
                  aria-label={`${c.nombre}, ${c.videos} ${c.videos === 1 ? "video" : "videos"}`}
                  className="flex aspect-square items-center justify-center rounded-[26px] border border-fuego-600/20 shadow-[0_10px_24px_-14px_rgba(163,58,44,0.45)] tarjeta-viva dark:!bg-card"
                  style={{ background: col.fondo }}
                >
                  <IconoMarca nombre={(c.icono as IconoMarcaNombre) ?? "mejorar"} size={60} />
                </Link>
                {editando && (
                  <>
                    <button type="button" onClick={() => abrir(c.id)} aria-label={`Editar categoría ${c.nombre}`} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-card text-mid shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                      <Pencil size={14} aria-hidden />
                    </button>
                    <span aria-hidden className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-lo dark:bg-black/30">
                      <GripVertical size={14} />
                    </span>
                  </>
                )}
                <p className="mx-0.5 text-sm font-semibold text-hi">{c.nombre}</p>
                <p className="-mt-1.5 mx-0.5 text-xs text-lo">{c.videos} {c.videos === 1 ? "video" : "videos"}</p>
              </motion.div>
            );
          })}
          </AnimatePresence>
          {editando && (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => abrir("nueva")} aria-label="Nueva categoría" className="flex aspect-square items-center justify-center rounded-[26px] border-2 border-dashed border-mark bg-white/50 text-lo dark:bg-white/5">
                <Plus size={30} aria-hidden />
              </button>
              <p className="mx-0.5 text-sm font-semibold text-lo">Agregar categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
