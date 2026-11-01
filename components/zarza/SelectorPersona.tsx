"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Inicial } from "@/components/zarza/ui";

export interface OpcionPersona {
  id: number | string;
  nombre: string;
  foto?: string | null;
  /** Texto chico al lado (p. ej. "sigue en la rotación"). */
  nota?: string;
}

/**
 * Selector de persona con el diseño Zarza (reemplaza al <select> del
 * sistema): el botón abre una hoja desde abajo en el celular (centrada en
 * computadora) con la lista, iniciales, tilde en la elegida y buscador
 * cuando la lista es larga. Se usa controlado (`valor` + `onChange`) o
 * dentro de un formulario con `name` (envía un input oculto).
 */
export function SelectorPersona({
  opciones,
  valor: valorProp,
  onChange,
  name,
  required,
  titulo,
  etiqueta,
  vacio = "Sin asignar",
  permitirVacio = true,
  disabled,
  tono = "vino",
  className = "",
}: {
  opciones: OpcionPersona[];
  valor?: string;
  onChange?: (id: string) => void;
  name?: string;
  required?: boolean;
  /** Título de la hoja (p. ej. "Elegir sonidista"). */
  titulo: string;
  /** Rótulo chico dentro del botón (p. ej. "PRINCIPAL"). */
  etiqueta?: string;
  vacio?: string;
  permitirVacio?: boolean;
  disabled?: boolean;
  tono?: "vino" | "arcilla";
  className?: string;
}) {
  const [interno, setInterno] = useState("");
  const valor = valorProp ?? interno;
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const reducir = useReducedMotion();
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const oculto = useRef<HTMLInputElement>(null);

  // Tras enviar, React reinicia el formulario: el selector vuelve a vacío.
  useEffect(() => {
    const form = oculto.current?.form;
    if (!form || valorProp !== undefined) return;
    const reiniciar = () => setInterno("");
    form.addEventListener("reset", reiniciar);
    return () => form.removeEventListener("reset", reiniciar);
  }, [valorProp]);

  const elegida = opciones.find((o) => String(o.id) === valor) ?? null;
  const conBuscador = opciones.length > 8;
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? opciones.filter((o) => o.nombre.toLowerCase().includes(q)) : opciones;
  }, [opciones, busqueda]);

  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = overflow; };
  }, [abierto]);

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
    setTimeout(() => boton.current?.focus(), 0);
  }

  function elegir(v: string) {
    if (valorProp === undefined) setInterno(v);
    onChange?.(v);
    cerrar();
    // Avisa al formulario (validación de "required").
    setTimeout(() => oculto.current?.setCustomValidity(""), 0);
  }

  // La hoja se monta en <body> para que ningún contenedor animado la desplace.
  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); }, []);

  const resorte = reducir ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  return (
    <>
      {name && (
        <input
          ref={oculto}
          tabIndex={-1}
          aria-hidden
          name={name}
          value={valor}
          required={required}
          onChange={() => {}}
          onInvalid={(e) => { e.preventDefault(); setAbierto(true); }}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`relative flex min-h-[46px] min-w-0 items-center gap-2 overflow-hidden rounded-[14px] border bg-card px-3 py-2 text-left transition-colors hover:border-fuego-500 disabled:opacity-60 dark:bg-input ${
          tono === "vino" ? "border-[#efc7b3] dark:border-[#573827]" : "border-mark"
        } ${className}`}
      >
        {/* Destello al elegir a alguien */}
        {elegida && <span key={String(elegida.id)} aria-hidden className="animate-destello pointer-events-none absolute inset-0 bg-fuego-500/20" />}
        {elegida?.foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={elegida.foto} alt="" aria-hidden className="relative h-7 w-7 shrink-0 rounded-full object-cover" />
        )}
        <span className="relative flex min-w-0 flex-1 flex-col gap-0.5">
          {etiqueta && <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a2a26] dark:text-[#d69271]">{etiqueta}</span>}
          <span className={`truncate text-sm font-semibold ${elegida ? "text-hi" : "text-lo"}`}>{elegida?.nombre ?? vacio}</span>
        </span>
        <ChevronDown size={16} aria-hidden className="relative shrink-0 text-lo" />
      </button>

      {montado && createPortal(
      <AnimatePresence>
        {abierto && (
          <motion.div
            className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducir ? 0 : 0.2 }}
          >
            <div aria-hidden onClick={cerrar} className="absolute inset-0 bg-[rgba(43,14,8,0.42)] dark:bg-[rgba(8,2,1,0.62)]" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-t`}
              initial={reducir ? { opacity: 0 } : { opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducir ? { opacity: 0 } : { opacity: 0, y: 32 }}
              transition={resorte}
              className="relative flex max-h-[82dvh] w-full max-w-[440px] flex-col rounded-t-[28px] border border-line bg-card pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_-12px_rgba(94,31,24,0.45)] sm:rounded-[26px] sm:pb-3 dark:shadow-black/70"
            >
              <span aria-hidden className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-mark sm:hidden" />
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-6">
                <h2 id={`${id}-t`} className="font-display text-lg font-bold tracking-[-0.02em] text-hi">{titulo}</h2>
                <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full text-lo hover:bg-fuego-600/10 hover:text-hi">
                  <X size={18} aria-hidden />
                </button>
              </div>

              {conBuscador && (
                <label className="relative mx-5 mb-2 flex">
                  <Search size={15} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lo" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter elige al primero en vez de enviar el formulario de atrás.
                      if (e.key === "Enter") { e.preventDefault(); if (visibles[0]) elegir(String(visibles[0].id)); }
                    }}
                    placeholder="Buscar por nombre"
                    aria-label="Buscar persona"
                    className="min-h-[44px] w-full rounded-full border border-mark bg-input py-2.5 pl-10 pr-4 text-sm text-hi placeholder:text-gone outline-none focus:border-fuego-500 focus:ring-2 focus:ring-fuego-500/30"
                  />
                </label>
              )}

              <ul role="listbox" aria-labelledby={`${id}-t`} className="escalonar flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
                {permitirVacio && !busqueda && (
                  <Opcion on={!valor} onClick={() => elegir("")} nombre={vacio} vacia />
                )}
                {visibles.map((o) => (
                  <Opcion key={o.id} on={String(o.id) === valor} onClick={() => elegir(String(o.id))} nombre={o.nombre} foto={o.foto} nota={o.nota} tono={tono} />
                ))}
                {visibles.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-lo">Nadie coincide con “{busqueda}”.</li>
                )}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  );
}

function Opcion({
  on, onClick, nombre, foto, nota, vacia, tono = "vino",
}: { on: boolean; onClick: () => void; nombre: string; foto?: string | null; nota?: string; vacia?: boolean; tono?: "vino" | "arcilla" }) {
  return (
    <li role="option" aria-selected={on}>
      <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl px-3 text-left transition-colors ${
          on ? "bg-fuego-600/10" : "hover:bg-fuego-600/5"
        }`}
      >
        {vacia ? (
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-mark text-lo">
            <X size={14} />
          </span>
        ) : (
          <Inicial nombre={nombre} foto={foto} size={36} tono={tono} />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] ${on ? "font-semibold text-fuego-600 dark:text-[#df8067]" : vacia ? "text-lo" : "font-medium text-hi"}`}>{nombre}</span>
          {nota && <span className="block truncate text-xs text-lo">{nota}</span>}
        </span>
        {on && <Check size={18} strokeWidth={2.5} aria-hidden className="animate-pop shrink-0 text-fuego-600 dark:text-[#df8067]" />}
      </button>
    </li>
  );
}
