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
  opciones,
  defaultValue = "",
  vacio = "Sin definir",
  className = "",
}: {
  name: string;
  label: string;
  opciones: readonly string[];
  defaultValue?: string;
  vacio?: string;
  className?: string;
}) {
  const [valor, setValor] = useState(defaultValue);
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

  const todas = ["", ...opciones];

  return (
    <div ref={ref} className={`relative flex flex-col gap-1.5 ${className}`}>
      <span id={`${id}-l`} className="text-[13px] font-medium text-mid">{label}</span>
      <input type="hidden" name={name} value={valor} />
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby={`${id}-l`}
        className={`flex min-h-[46px] items-center justify-between gap-2 rounded-xl border bg-input pl-4 pr-3.5 text-left text-sm text-hi transition-colors ${
          abierto ? "border-fuego-600" : "border-mark"
        }`}
      >
        <span className={valor ? "" : "text-gone"}>{valor || vacio}</span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-lo transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-labelledby={`${id}-l`}
          className="animate-desplegar absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-[260px] overflow-y-auto rounded-[14px] border border-line bg-card p-1.5 shadow-[0_12px_32px_-8px_rgba(120,45,15,0.35)] dark:shadow-black/60"
        >
          {todas.map((o) => {
            const on = o === valor;
            return (
              <li key={o || "_vacio"} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => { setValor(o); setAbierto(false); }}
                  className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-[10px] px-3 text-left text-sm ${
                    on ? "bg-fuego-600/10 font-semibold text-fuego-600 dark:text-[#df8067]" : o ? "text-hi hover:bg-fuego-600/5" : "text-lo hover:bg-fuego-600/5"
                  }`}
                >
                  {o || vacio}
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
