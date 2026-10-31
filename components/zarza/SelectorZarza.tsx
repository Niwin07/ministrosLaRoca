"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Desplegable del diseño (Estilo / Tono en "Sugerir canción"): botón con
 * flecha que gira y una lista flotante con tilde en la opción elegida.
 * Envía el valor en un <input hidden name> para usarse en formularios.
 */
export function SelectorZarza({
  name,
  label,
  opciones: opcionesIn,
  defaultValue = "",
  vacio = "Sin definir",
  sinVacio = false,
  required,
  ocultarLabel,
  compacto,
  className = "",
}: {
  name: string;
  label: string;
  /** Textos, o pares { valor, texto } cuando lo que se envía difiere de lo que se ve. */
  opciones: readonly (string | { valor: string; texto: string })[];
  defaultValue?: string;
  vacio?: string;
  /** Sin la opción vacía (el campo siempre tiene un valor). */
  sinVacio?: boolean;
  required?: boolean;
  /** El rótulo queda sólo para lectores de pantalla. */
  ocultarLabel?: boolean;
  /** Versión baja (36px) para filas de acciones. */
  compacto?: boolean;
  className?: string;
}) {
  const opciones = opcionesIn.map((o) => (typeof o === "string" ? { valor: o, texto: o } : o));
  const [valor, setValor] = useState(defaultValue || (sinVacio ? opciones[0]?.valor ?? "" : ""));
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierto]);

  // Tras enviar, React reinicia el formulario: vuelve al valor inicial.
  const oculto = useRef<HTMLInputElement>(null);
  const inicial = defaultValue || (sinVacio ? opciones[0]?.valor ?? "" : "");
  useEffect(() => {
    const form = oculto.current?.form;
    if (!form) return;
    const reiniciar = () => setValor(inicial);
    form.addEventListener("reset", reiniciar);
    return () => form.removeEventListener("reset", reiniciar);
  }, [inicial]);

  const todas = sinVacio ? opciones : [{ valor: "", texto: vacio }, ...opciones];
  const elegido = opciones.find((o) => o.valor === valor);

  return (
    <div ref={ref} className={`relative flex flex-col gap-1.5 ${className}`}>
      <span id={`${id}-l`} className={ocultarLabel ? "sr-only" : "text-[13px] font-medium text-mid"}>{label}</span>
      <input
        ref={oculto}
        tabIndex={-1}
        aria-hidden
        name={name}
        value={valor}
        required={required}
        onChange={() => {}}
        onInvalid={(e) => { e.preventDefault(); setAbierto(true); }}
        className="pointer-events-none absolute bottom-0 left-4 h-0 w-0 opacity-0"
      />
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby={`${id}-l`}
        className={`flex items-center justify-between gap-2 border bg-input text-left text-hi transition-colors ${compacto ? "min-h-[36px] rounded-full pl-3.5 pr-2.5 text-[13px]" : "min-h-[46px] rounded-xl pl-4 pr-3.5 text-sm"} ${
          abierto ? "border-fuego-600" : "border-mark"
        }`}
      >
        <span className={elegido ? "truncate" : "truncate text-gone"}>{elegido?.texto ?? vacio}</span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-lo transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-labelledby={`${id}-l`}
          className="animate-desplegar absolute left-0 right-0 top-[calc(100%+6px)] z-30 min-w-[200px] max-h-[260px] overflow-y-auto rounded-[14px] border border-line bg-card p-1.5 shadow-[0_12px_32px_-8px_rgba(120,45,15,0.35)] dark:shadow-black/60"
        >
          {todas.map((o) => {
            const on = o.valor === valor;
            return (
              <li key={o.valor || "_vacio"} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => { setValor(o.valor); setAbierto(false); }}
                  className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-[10px] px-3 text-left text-sm ${
                    on ? "bg-fuego-600/10 font-semibold text-fuego-600 dark:text-[#df8067]" : o.valor ? "text-hi hover:bg-fuego-600/5" : "text-lo hover:bg-fuego-600/5"
                  }`}
                >
                  {o.texto}
                  {on && <Check size={14} strokeWidth={2.5} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
